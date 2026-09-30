-- Token count of each reference-library file, as the model sees it. Filled by
-- the library-tokens function after upload; the admin screen sums it per
-- expert to show what the library adds to every question.
alter table public.expert_library add column if not exists token_count integer;
