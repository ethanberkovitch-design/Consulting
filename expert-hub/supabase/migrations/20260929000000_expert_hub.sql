-- Expert Hub: conversations, messages, user documents and the per-expert
-- reference library. Every table is protected by RLS; users only ever see
-- their own rows. The library is readable by any signed-in user and writable
-- only by admins listed in expert_admins.

create table if not exists public.expert_admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create or replace function public.is_expert_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.expert_admins where user_id = auth.uid());
$$;

create table if not exists public.expert_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  expert_id text not null,
  title text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists expert_conversations_user_idx
  on public.expert_conversations (user_id, updated_at desc);

create table if not exists public.expert_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.expert_conversations (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  kind text not null default 'chat' check (kind in ('chat', 'report')),
  content text not null,
  sources jsonb not null default '[]'::jsonb,
  usage jsonb,
  created_at timestamptz not null default now()
);
create index if not exists expert_messages_conversation_idx
  on public.expert_messages (conversation_id, created_at);

create table if not exists public.expert_documents (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.expert_conversations (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  media_type text not null,
  storage_path text not null,
  size_bytes bigint not null,
  created_at timestamptz not null default now()
);
create index if not exists expert_documents_conversation_idx
  on public.expert_documents (conversation_id, created_at);

create table if not exists public.expert_library (
  id uuid primary key default gen_random_uuid(),
  expert_id text not null,
  title text not null,
  media_type text not null,
  storage_path text not null,
  size_bytes bigint not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists expert_library_expert_idx
  on public.expert_library (expert_id) where active;

alter table public.expert_admins enable row level security;
alter table public.expert_conversations enable row level security;
alter table public.expert_messages enable row level security;
alter table public.expert_documents enable row level security;
alter table public.expert_library enable row level security;

create policy "admins read own admin row" on public.expert_admins
  for select to authenticated using (user_id = auth.uid());

create policy "own conversations" on public.expert_conversations
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "own messages" on public.expert_messages
  for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.expert_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

create policy "own documents" on public.expert_documents
  for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.expert_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

create policy "library readable by signed-in users" on public.expert_library
  for select to authenticated using (active or public.is_expert_admin());

create policy "library managed by admins" on public.expert_library
  for all to authenticated
  using (public.is_expert_admin())
  with check (public.is_expert_admin());

-- Private buckets. User documents live under <user_id>/<conversation_id>/...
insert into storage.buckets (id, name, public, file_size_limit)
values
  ('expert-docs', 'expert-docs', false, 31457280),
  ('expert-library', 'expert-library', false, 31457280)
on conflict (id) do nothing;

create policy "users manage own document files" on storage.objects
  for all to authenticated
  using (bucket_id = 'expert-docs' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'expert-docs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "signed-in users read library files" on storage.objects
  for select to authenticated
  using (bucket_id = 'expert-library');

create policy "admins manage library files" on storage.objects
  for all to authenticated
  using (bucket_id = 'expert-library' and public.is_expert_admin())
  with check (bucket_id = 'expert-library' and public.is_expert_admin());
