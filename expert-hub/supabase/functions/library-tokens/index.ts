/**
 * library-tokens — counts how many input tokens a reference-library file adds
 * to every question put to its expert, and stores it on the row.
 *
 * POST { libraryId }   Authorization: Bearer <admin access token>
 * → { tokenCount }
 *
 * Admin-only. The file is sent to the token-counting endpoint in the same
 * block shape expert-chat uses, so the count matches what a question pays for.
 */
import Anthropic from 'npm:@anthropic-ai/sdk@^0.129.0';
import { createClient } from 'npm:@supabase/supabase-js@^2.117.0';

const MODEL = Deno.env.get('EXPERT_MODEL') ?? 'claude-opus-5-5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Not signed in' }, 401);
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return json({ error: 'Not signed in' }, 401);
  if ((await supabase.rpc('is_expert_admin')).data !== true) return json({ error: 'Admins only' }, 403);

  let libraryId: string | undefined;
  try {
    libraryId = (await req.json()).libraryId;
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  if (!libraryId) return json({ error: 'libraryId is required' }, 400);

  const { data: row } = await supabase
    .from('expert_library')
    .select('id, title, media_type, storage_path')
    .eq('id', libraryId)
    .maybeSingle();
  if (!row) return json({ error: 'Library file not found' }, 404);

  const { data: file, error: downloadError } = await supabase.storage.from('expert-library').download(row.storage_path);
  if (downloadError || !file) return json({ error: 'Could not read the file' }, 500);

  const title = `Reference library: ${row.title}`;
  let content: Anthropic.ContentBlockParam[];
  if (row.media_type === 'application/pdf') {
    content = [{ type: 'document', title, source: { type: 'base64', media_type: 'application/pdf', data: toBase64(await file.arrayBuffer()) } }];
  } else if (row.media_type.startsWith('image/')) {
    content = [
      { type: 'text', text: `[${title}]` },
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: row.media_type as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp',
          data: toBase64(await file.arrayBuffer()),
        },
      },
    ];
  } else {
    content = [{ type: 'document', title, source: { type: 'text', media_type: 'text/plain', data: await file.text() } }];
  }

  try {
    const anthropic = new Anthropic();
    const [withFile, baseline] = await Promise.all([
      anthropic.messages.countTokens({ model: MODEL, messages: [{ role: 'user', content: [...content, { type: 'text', text: '.' }] }] }),
      anthropic.messages.countTokens({ model: MODEL, messages: [{ role: 'user', content: [{ type: 'text', text: '.' }] }] }),
    ]);
    const tokenCount = withFile.input_tokens - baseline.input_tokens;
    const { error } = await supabase.from('expert_library').update({ token_count: tokenCount }).eq('id', row.id);
    if (error) return json({ error: error.message }, 500);
    return json({ tokenCount });
  } catch (err) {
    // A file the model cannot take (too many pages, corrupt PDF) fails here, before any user sees it.
    const message = err instanceof Anthropic.APIError ? `Model error (${err.status ?? 'network'}): ${err.message}` : 'Token count failed';
    return json({ error: message }, 422);
  }
});

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
