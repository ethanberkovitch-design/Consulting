import { supabase, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './supabase';
import type { PreparedFile } from './files';
import type { Language } from './i18n';
import type { ExpertId } from '../experts/registry';

export interface Conversation {
  id: string;
  expert_id: ExpertId;
  title: string;
  updated_at: string;
}

export interface Source {
  url: string;
  title: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  kind: 'chat' | 'report';
  content: string;
  sources: Source[];
  created_at: string;
}

export interface DocumentRow {
  id: string;
  name: string;
  media_type: string;
  storage_path: string;
  size_bytes: number;
}

export async function listConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('expert_conversations')
    .select('id, expert_id, title, updated_at')
    .order('updated_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data as Conversation[];
}

export async function createConversation(expertId: ExpertId): Promise<Conversation> {
  const { data, error } = await supabase
    .from('expert_conversations')
    .insert({ expert_id: expertId })
    .select('id, expert_id, title, updated_at')
    .single();
  if (error) throw error;
  return data as Conversation;
}

export async function deleteConversation(conversation: Conversation, documents: DocumentRow[]) {
  if (documents.length > 0) {
    await supabase.storage.from('expert-docs').remove(documents.map((d) => d.storage_path));
  }
  const { error } = await supabase.from('expert_conversations').delete().eq('id', conversation.id);
  if (error) throw error;
}

export async function loadMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('expert_messages')
    .select('id, role, kind, content, sources, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at');
  if (error) throw error;
  return data as Message[];
}

export async function loadDocuments(conversationId: string): Promise<DocumentRow[]> {
  const { data, error } = await supabase
    .from('expert_documents')
    .select('id, name, media_type, storage_path, size_bytes')
    .eq('conversation_id', conversationId)
    .order('created_at');
  if (error) throw error;
  return data as DocumentRow[];
}

export async function uploadDocument(
  userId: string,
  conversationId: string,
  file: PreparedFile,
): Promise<DocumentRow> {
  const safeName = file.name.replace(/[^\w.-]+/g, '_').slice(-80);
  const path = `${userId}/${conversationId}/${crypto.randomUUID()}-${safeName}`;
  const { error: uploadError } = await supabase.storage
    .from('expert-docs')
    .upload(path, file.blob, { contentType: file.mediaType });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('expert_documents')
    .insert({
      conversation_id: conversationId,
      name: file.name,
      media_type: file.mediaType,
      storage_path: path,
      size_bytes: file.blob.size,
    })
    .select('id, name, media_type, storage_path, size_bytes')
    .single();
  if (error) {
    await supabase.storage.from('expert-docs').remove([path]);
    throw error;
  }
  return data as DocumentRow;
}

export async function removeDocument(doc: DocumentRow) {
  await supabase.storage.from('expert-docs').remove([doc.storage_path]);
  const { error } = await supabase.from('expert_documents').delete().eq('id', doc.id);
  if (error) throw error;
}

export type StreamEvent =
  | { type: 'status'; status: 'thinking' | 'searching' | 'calculating' | 'writing' }
  | { type: 'text'; text: string }
  | { type: 'done'; messageId: string; sources: Source[] }
  | { type: 'error'; error: string };

/** Calls the expert and yields server-sent events as they arrive. */
export async function* streamExpert(
  params: { conversationId: string; mode: 'chat' | 'report'; message?: string; language: Language },
  signal: AbortSignal,
): AsyncGenerator<StreamEvent> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not signed in');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/expert-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      apikey: SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify(params),
    signal,
  });

  if (!response.ok || !response.body) {
    let message = `HTTP ${response.status}`;
    try {
      const payload = await response.json();
      if (payload?.error) message = payload.error;
    } catch {
      // keep the status message
    }
    throw new Error(message);
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const chunk = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const line = chunk.split('\n').find((l) => l.startsWith('data: '));
      if (line) yield JSON.parse(line.slice(6)) as StreamEvent;
      boundary = buffer.indexOf('\n\n');
    }
  }
}
