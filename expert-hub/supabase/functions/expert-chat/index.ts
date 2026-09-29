/**
 * expert-chat — the only place that talks to Claude.
 *
 * POST { conversationId, mode: 'chat' | 'report', message?, language: 'he' | 'en' }
 * Authorization: Bearer <user access token>
 *
 * Responds with Server-Sent Events:
 *   {type:'status', status:'thinking'|'searching'}
 *   {type:'text', text}
 *   {type:'done', messageId, sources, model, usage, stopReason}
 *   {type:'error', error}
 *
 * Admins (public.expert_admins) may pass `effort` to override EXPERT_EFFORT
 * for one request — used by the eval runner to compare settings. Everyone
 * else always gets the configured effort.
 *
 * All database and storage access runs with the caller's JWT, so RLS decides
 * what this function can read — a user can never pull another user's files.
 * The Anthropic key lives only in the function's secrets.
 */
import Anthropic from 'npm:@anthropic-ai/sdk@^0.129.0';
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@^2.117.0';
import {
  EXPERTS,
  buildReportInstruction,
  buildSystemPrompt,
  isExpertId,
  type ExpertDefinition,
} from '../_shared/experts.ts';

const MODEL = Deno.env.get('EXPERT_MODEL') ?? 'claude-opus-5-5';
type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max';
const EFFORTS: readonly Effort[] = ['low', 'medium', 'high', 'xhigh', 'max'];
const EFFORT = (Deno.env.get('EXPERT_EFFORT') ?? 'high') as Effort;
const MAX_TOKENS = 64000;
/** Anthropic's request limit is 32 MB; base64 inflates by ~4/3. Stay well under. */
const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;
/** Server tools may pause a long turn; resume at most this many times. */
const MAX_CONTINUATIONS = 4;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Language = 'he' | 'en';
type ContentBlock = Anthropic.Beta.BetaContentBlockParam;
type MessageParam = Anthropic.Beta.BetaMessageParam;

interface Source {
  url: string;
  title: string;
}

interface AttachmentRow {
  name: string;
  media_type: string;
  storage_path: string;
  size_bytes: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Not signed in' }, 401);

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return json({ error: 'Not signed in' }, 401);

  let body: { conversationId?: string; mode?: string; message?: string; language?: string; effort?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  const mode = body.mode === 'report' ? 'report' : 'chat';
  const language: Language = body.language === 'en' ? 'en' : 'he';
  const message = (body.message ?? '').trim();
  if (!body.conversationId) return json({ error: 'conversationId is required' }, 400);
  if (mode === 'chat' && !message) return json({ error: 'message is required' }, 400);

  const { data: conversation } = await supabase
    .from('expert_conversations')
    .select('id, expert_id, title')
    .eq('id', body.conversationId)
    .maybeSingle();
  if (!conversation) return json({ error: 'Conversation not found' }, 404);
  if (!isExpertId(conversation.expert_id)) return json({ error: 'Unknown expert' }, 400);
  const expert = EXPERTS[conversation.expert_id];

  let effort = EFFORT;
  if (body.effort !== undefined) {
    if (!EFFORTS.includes(body.effort as Effort)) return json({ error: 'Invalid effort' }, 400);
    const { data: isAdmin } = await supabase.rpc('is_expert_admin');
    if (isAdmin !== true) return json({ error: 'effort override is admin-only' }, 403);
    effort = body.effort as Effort;
  }

  if (mode === 'chat') {
    const { error } = await supabase
      .from('expert_messages')
      .insert({ conversation_id: conversation.id, role: 'user', kind: 'chat', content: message });
    if (error) return json({ error: error.message }, 500);
    if (!conversation.title) {
      await supabase
        .from('expert_conversations')
        .update({ title: message.slice(0, 80) })
        .eq('id', conversation.id);
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: Record<string, unknown>) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          // Client went away; keep generating so the answer is still saved.
        }
      };
      try {
        await answer({ supabase, expert, conversationId: conversation.id, mode, language, effort, send });
      } catch (err) {
        console.error(err);
        send({ type: 'error', error: describeError(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
});

async function answer(args: {
  supabase: SupabaseClient;
  expert: ExpertDefinition;
  conversationId: string;
  mode: 'chat' | 'report';
  language: Language;
  effort: Effort;
  send: (event: Record<string, unknown>) => void;
}) {
  const { supabase, expert, conversationId, mode, language, effort, send } = args;
  send({ type: 'status', status: 'thinking' });

  const [{ data: history }, { data: documents }, { data: library }] = await Promise.all([
    supabase
      .from('expert_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .eq('kind', 'chat')
      .order('created_at'),
    supabase
      .from('expert_documents')
      .select('name, media_type, storage_path, size_bytes')
      .eq('conversation_id', conversationId)
      .order('created_at'),
    supabase
      .from('expert_library')
      .select('title, media_type, storage_path, size_bytes')
      .eq('expert_id', expert.id)
      .eq('active', true)
      .order('created_at'),
  ]);

  const attachmentBlocks = await buildAttachmentBlocks(
    supabase,
    (library ?? []).map((row) => ({ ...row, name: row.title })),
    documents ?? [],
  );

  const turns: MessageParam[] = (history ?? []).map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: [{ type: 'text', text: m.content }],
  }));
  if (mode === 'report') {
    turns.push({ role: 'user', content: [{ type: 'text', text: buildReportInstruction(expert, language) }] });
  }
  if (turns.length === 0 || turns[0].role !== 'user') {
    turns.unshift({ role: 'user', content: [{ type: 'text', text: '(conversation start)' }] });
  }
  // Attachments ride on the first user turn so the growing conversation keeps
  // a stable, cacheable prefix: system → documents → history.
  (turns[0].content as ContentBlock[]).unshift(...attachmentBlocks);
  const messages = mergeConsecutiveRoles(turns);

  let system = buildSystemPrompt(expert, language);
  if (expert.preferredSources.length > 0) {
    system += `\n\n## Preferred web sources\nWhen searching, prefer: ${expert.preferredSources.join(', ')}.`;
  }

  const anthropic = new Anthropic();
  let finalText = '';
  const sources = new Map<string, Source>();
  let usage: Record<string, unknown> | null = null;
  let servedModel = MODEL;
  let stopReason: string | null = null;

  for (let attempt = 0; attempt <= MAX_CONTINUATIONS; attempt++) {
    const stream = anthropic.beta.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      thinking: { type: 'adaptive' },
      output_config: { effort },
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      cache_control: { type: 'ephemeral' },
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 5 }],
      messages,
      betas: ['server-side-fallback-2026-07-01'],
      // Policy declines are re-run on Anthropic's recommended fallback model.
      fallbacks: 'default',
    });

    for await (const event of stream) {
      if (event.type === 'content_block_start' && event.content_block.type === 'server_tool_use') {
        send({ type: 'status', status: 'searching' });
      } else if (event.type === 'content_block_start' && event.content_block.type === 'text') {
        send({ type: 'status', status: 'writing' });
      } else if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        finalText += event.delta.text;
        send({ type: 'text', text: event.delta.text });
      }
    }

    const final = await stream.finalMessage();
    usage = final.usage as unknown as Record<string, unknown>;
    servedModel = final.model;
    stopReason = final.stop_reason;
    collectSources(final.content, sources);

    if (final.stop_reason === 'refusal') {
      throw new Error(language === 'he' ? 'הבקשה נדחתה על ידי מסנני הבטיחות של המודל.' : 'The model declined this request.');
    }
    if (final.stop_reason === 'pause_turn') {
      messages.push({ role: 'assistant', content: final.content as ContentBlock[] });
      continue;
    }
    if (final.stop_reason === 'max_tokens') {
      const note = language === 'he' ? '\n\n_(התשובה נקטעה בשל אורכה.)_' : '\n\n_(The answer was cut off for length.)_';
      finalText += note;
      send({ type: 'text', text: note });
    }
    break;
  }

  const sourceList = [...sources.values()];
  const { data: saved, error } = await supabase
    .from('expert_messages')
    .insert({
      conversation_id: conversationId,
      role: 'assistant',
      kind: mode,
      content: finalText,
      sources: sourceList,
      usage,
    })
    .select('id')
    .single();
  if (error) throw error;
  await supabase
    .from('expert_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  send({ type: 'done', messageId: saved.id, sources: sourceList, model: servedModel, usage, stopReason });
}

async function buildAttachmentBlocks(
  supabase: SupabaseClient,
  library: AttachmentRow[],
  documents: AttachmentRow[],
): Promise<ContentBlock[]> {
  const blocks: ContentBlock[] = [];
  const skipped: string[] = [];
  let budget = MAX_ATTACHMENT_BYTES;

  const add = async (bucket: string, row: AttachmentRow, label: string) => {
    if (row.size_bytes > budget) {
      skipped.push(row.name);
      return;
    }
    const { data, error } = await supabase.storage.from(bucket).download(row.storage_path);
    if (error || !data) {
      skipped.push(row.name);
      return;
    }
    budget -= row.size_bytes;
    const title = `${label}: ${row.name}`;
    if (row.media_type === 'application/pdf') {
      blocks.push({
        type: 'document',
        title,
        source: { type: 'base64', media_type: 'application/pdf', data: toBase64(await data.arrayBuffer()) },
      });
    } else if (row.media_type.startsWith('image/')) {
      blocks.push({ type: 'text', text: `[${title}]` });
      blocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: row.media_type as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp',
          data: toBase64(await data.arrayBuffer()),
        },
      });
    } else {
      blocks.push({
        type: 'document',
        title,
        source: { type: 'text', media_type: 'text/plain', data: await data.text() },
      });
    }
  };

  for (const row of library) await add('expert-library', row, 'Reference library');
  for (const row of documents) await add('expert-docs', row, 'User document');

  if (skipped.length > 0) {
    blocks.push({
      type: 'text',
      text: `These documents are attached to the conversation but could not be included (size limit or read error), so you have NOT seen them: ${skipped.join(', ')}. Tell the user if they matter to the question.`,
    });
  }
  if (blocks.length > 0) {
    const last = blocks[blocks.length - 1] as { cache_control?: { type: 'ephemeral' } };
    last.cache_control = { type: 'ephemeral' };
  }
  return blocks;
}

/** The API expects alternating roles; a failed earlier turn can leave two user turns in a row. */
function mergeConsecutiveRoles(turns: MessageParam[]): MessageParam[] {
  const merged: MessageParam[] = [];
  for (const turn of turns) {
    const prev = merged[merged.length - 1];
    if (prev && prev.role === turn.role) {
      (prev.content as ContentBlock[]).push(...(turn.content as ContentBlock[]));
    } else {
      merged.push({ role: turn.role, content: [...(turn.content as ContentBlock[])] });
    }
  }
  return merged;
}

function collectSources(content: Anthropic.Beta.BetaContentBlock[], into: Map<string, Source>) {
  for (const block of content) {
    if (block.type !== 'text' || !block.citations) continue;
    for (const citation of block.citations) {
      if (citation.type === 'web_search_result_location' && !into.has(citation.url)) {
        into.set(citation.url, { url: citation.url, title: citation.title ?? citation.url });
      }
    }
  }
}

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function describeError(err: unknown): string {
  if (err instanceof Anthropic.RateLimitError) return 'The service is busy. Please try again in a minute.';
  if (err instanceof Anthropic.APIError) return `Model error (${err.status ?? 'network'}): ${err.message}`;
  return err instanceof Error ? err.message : 'Unexpected error';
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
