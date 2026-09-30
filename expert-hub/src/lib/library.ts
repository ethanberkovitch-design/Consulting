import { supabase, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './supabase';
import type { PreparedFile } from './files';
import type { ExpertId } from '../experts/registry';

/**
 * Reference library: files attached to an expert that the model receives with
 * every question put to that expert (see expert-chat). Managed by admins only;
 * RLS on expert_library and the expert-library bucket enforces it.
 */
export interface LibraryRow {
  id: string;
  expert_id: ExpertId;
  title: string;
  media_type: string;
  storage_path: string;
  size_bytes: number;
  active: boolean;
  token_count: number | null;
  created_at: string;
}

/**
 * expert-chat sends at most 20 MB of attachments per question, library first,
 * then the user's own documents. Capping the active library at 15 MB per expert
 * keeps at least 5 MB for the user's files.
 */
export const LIBRARY_MAX_BYTES = 15 * 1024 * 1024;

/** Above this the admin screen warns. Our own threshold, not an API limit. */
export const LIBRARY_WARN_TOKENS = 100_000;

/**
 * claude-opus-5-5 input price, $ per million tokens (Anthropic pricing).
 * The library is cached: the first question in a 5-minute window writes the
 * cache (1.25× input), later questions read it ($0.20 per million).
 */
const INPUT_PER_MTOK = 4;
const CACHE_WRITE_PER_MTOK = INPUT_PER_MTOK * 1.25;
const CACHE_READ_PER_MTOK = 0.2;

export function libraryCostPerQuestion(tokens: number) {
  return {
    first: (tokens / 1_000_000) * CACHE_WRITE_PER_MTOK,
    cached: (tokens / 1_000_000) * CACHE_READ_PER_MTOK,
  };
}

const COLUMNS = 'id, expert_id, title, media_type, storage_path, size_bytes, active, token_count, created_at';

export async function isAdmin(): Promise<boolean> {
  const { data } = await supabase.rpc('is_expert_admin');
  return data === true;
}

export async function listLibrary(): Promise<LibraryRow[]> {
  const { data, error } = await supabase.from('expert_library').select(COLUMNS).order('created_at');
  if (error) throw error;
  return data as LibraryRow[];
}

export async function uploadLibraryFile(expertId: ExpertId, title: string, file: PreparedFile): Promise<LibraryRow> {
  const ext = file.mediaType === 'text/plain' ? 'txt' : (file.name.split('.').pop()?.toLowerCase() ?? 'bin');
  const path = `${expertId}/${crypto.randomUUID()}.${ext.replace(/[^a-z0-9]/g, '') || 'bin'}`;
  const { error: uploadError } = await supabase.storage
    .from('expert-library')
    .upload(path, file.blob, { contentType: file.mediaType });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('expert_library')
    // Starts inactive: it goes live only after its tokens are counted, so a file
    // the model cannot read never reaches a user's question.
    .insert({ expert_id: expertId, title, media_type: file.mediaType, storage_path: path, size_bytes: file.blob.size, active: false })
    .select(COLUMNS)
    .single();
  if (error) {
    await supabase.storage.from('expert-library').remove([path]);
    throw error;
  }
  return data as LibraryRow;
}

export async function setLibraryActive(row: LibraryRow, active: boolean) {
  const { error } = await supabase.from('expert_library').update({ active }).eq('id', row.id);
  if (error) throw error;
}

export async function renameLibraryFile(row: LibraryRow, title: string) {
  const { error } = await supabase.from('expert_library').update({ title }).eq('id', row.id);
  if (error) throw error;
}

export async function deleteLibraryFile(row: LibraryRow) {
  const { error } = await supabase.from('expert_library').delete().eq('id', row.id);
  if (error) throw error;
  await supabase.storage.from('expert-library').remove([row.storage_path]);
}

/** Counts the file's tokens on the server and stores them on the row. */
export async function countLibraryTokens(row: LibraryRow): Promise<number> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not signed in');
  const response = await fetch(`${SUPABASE_URL}/functions/v1/library-tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, apikey: SUPABASE_PUBLISHABLE_KEY },
    body: JSON.stringify({ libraryId: row.id }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error ?? `HTTP ${response.status}`);
  return payload.tokenCount as number;
}
