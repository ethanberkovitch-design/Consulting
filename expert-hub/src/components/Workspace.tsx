import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileUp,
  Loader2,
  Search,
  Send,
  Square,
  Trash2,
  X,
  ScrollText,
  ExternalLink,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { Markdown } from './Markdown';
import { ReportView } from './ReportView';
import { useI18n } from '../lib/i18n';
import { CATEGORY_COLOR, type ExpertCard } from '../experts/registry';
import {
  createConversation,
  deleteConversation,
  loadDocuments,
  loadMessages,
  removeDocument,
  streamExpert,
  uploadDocument,
  type Conversation,
  type DocumentRow,
  type Message,
} from '../lib/api';
import { ACCEPT, MAX_FILE_BYTES, UnsupportedFileError, formatBytes, prepareFile } from '../lib/files';

interface WorkspaceProps {
  user: User;
  expert: ExpertCard;
  /** null until the first question or upload — empty conversations are never stored. */
  conversation: Conversation | null;
  onCreated: (conversation: Conversation) => void;
  onBack: () => void;
  onChanged: () => void;
}

type Status = 'thinking' | 'searching' | 'writing';

interface Pending {
  mode: 'chat' | 'report';
  text: string;
  status: Status;
}

export function Workspace({ user, expert, conversation: initial, onCreated, onBack, onChanged }: WorkspaceProps) {
  const { t, lang, dir } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(initial);
  const [loading, setLoading] = useState(initial !== null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [openReport, setOpenReport] = useState<Message | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  // Load only the conversation this workspace opened with. A conversation created here
  // later (first question) must not trigger a reload that would wipe the live answer.
  const [initialId] = useState(initial?.id);
  useEffect(() => {
    let cancelled = false;
    if (!initialId) return;
    Promise.all([loadMessages(initialId), loadDocuments(initialId)])
      .then(([m, d]) => {
        if (cancelled) return;
        setMessages(m);
        setDocuments(d);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [initialId]);

  useEffect(() => () => abortRef.current?.abort(), []);

  // One shared promise, so several uploads at once still create a single conversation.
  const conversationRef = useRef<Promise<Conversation> | null>(initial ? Promise.resolve(initial) : null);
  const ensureConversation = useCallback((): Promise<Conversation> => {
    if (!conversationRef.current) {
      const creating = createConversation(expert.id).then((created) => {
        setConversation(created);
        onCreated(created);
        return created;
      });
      creating.catch(() => {
        conversationRef.current = null;
      });
      conversationRef.current = creating;
    }
    return conversationRef.current;
  }, [expert.id, onCreated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, pending?.text]);

  const run = useCallback(
    async (mode: 'chat' | 'report', message?: string) => {
      setError(null);
      if (mode === 'chat' && message) {
        setMessages((prev) => [
          ...prev,
          {
            id: `local-${Date.now()}`,
            role: 'user',
            kind: 'chat',
            content: message,
            sources: [],
            created_at: new Date().toISOString(),
          },
        ]);
      }
      const controller = new AbortController();
      abortRef.current = controller;
      setPending({ mode, text: '', status: 'thinking' });
      let text = '';
      try {
        const { id: conversationId } = await ensureConversation();
        for await (const event of streamExpert({ conversationId, mode, message, language: lang }, controller.signal)) {
          if (event.type === 'status') {
            setPending((p) => (p ? { ...p, status: event.status } : p));
          } else if (event.type === 'text') {
            text += event.text;
            setPending((p) => (p ? { ...p, text, status: 'writing' } : p));
          } else if (event.type === 'error') {
            throw new Error(event.error);
          } else if (event.type === 'done') {
            const saved: Message = {
              id: event.messageId,
              role: 'assistant',
              kind: mode,
              content: text,
              sources: event.sources,
              created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, saved]);
            if (mode === 'report') setOpenReport(saved);
          }
        }
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : t('somethingWrong'));
        else if (text) {
          // The server keeps generating and saves the full answer; show what arrived.
          setMessages((prev) => [
            ...prev,
            { id: `partial-${Date.now()}`, role: 'assistant', kind: mode, content: text, sources: [], created_at: new Date().toISOString() },
          ]);
        }
      } finally {
        setPending(null);
        abortRef.current = null;
        onChanged();
      }
    },
    [ensureConversation, lang, onChanged, t],
  );

  const send = () => {
    const message = draft.trim();
    if (!message || pending) return;
    setDraft('');
    void run('chat', message);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    const problems: string[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_BYTES) {
        problems.push(`${t('fileTooLarge')} ${file.name}`);
        continue;
      }
      try {
        const prepared = await prepareFile(file);
        const { id: conversationId } = await ensureConversation();
        const row = await uploadDocument(user.id, conversationId, prepared);
        setDocuments((prev) => [...prev, row]);
      } catch (err) {
        problems.push(
          err instanceof UnsupportedFileError
            ? `${t('fileUnsupported')} ${file.name}`
            : `${file.name}: ${err instanceof Error ? err.message : t('somethingWrong')}`,
        );
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (problems.length > 0) setError(problems.join('\n'));
  };

  const handleRemove = async (doc: DocumentRow) => {
    try {
      await removeDocument(doc);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('somethingWrong'));
    }
  };

  const handleDelete = async () => {
    if (!conversation) {
      onBack();
      return;
    }
    if (!window.confirm(t('confirmDelete'))) return;
    try {
      await deleteConversation(conversation, documents);
      onChanged();
      onBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('somethingWrong'));
    }
  };

  const reports = messages.filter((m) => m.kind === 'report' && m.role === 'assistant');
  const chat = messages.filter((m) => m.kind === 'chat');
  const canReport = !pending && (documents.length > 0 || chat.length > 0);
  const statusLabel: Record<Status, string> = {
    thinking: t('statusThinking'),
    searching: t('statusSearching'),
    writing: t('statusWriting'),
  };
  const dateFormat = new Intl.DateTimeFormat(lang === 'he' ? 'he-IL' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      {/* Conversation */}
      <section className="bp-panel bp-corners flex min-h-[calc(100vh-6rem)] min-w-0 flex-col">
        <div className="flex items-center gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            onClick={onBack}
            className="btn-line grid h-9 w-9 place-items-center rounded-md"
            aria-label={t('allExperts')}
            title={t('allExperts')}
          >
            <BackIcon className="h-5 w-5" aria-hidden="true" />
          </button>
          <span
            className="grid h-10 w-10 place-items-center rounded-lg border"
            style={{ borderColor: 'var(--border)', background: 'rgba(6,16,29,0.6)', color: CATEGORY_COLOR[expert.category] }}
          >
            <expert.icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 truncate font-bold">
              {expert.name[lang]}
              <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full" style={{ background: 'var(--status-good)' }} aria-hidden="true" />
            </h1>
            {conversation?.title && (
              <p dir="auto" className="truncate text-start text-xs" style={{ color: 'var(--text-muted)' }}>
                {conversation.title}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleDelete}
            className="grid h-9 w-9 place-items-center rounded-md transition-colors hover:bg-[rgba(255,122,114,0.1)] hover:text-[var(--status-critical)]"
            aria-label={t('deleteConversation')}
            title={t('deleteConversation')}
            style={{ color: 'var(--text-muted)' }}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5" aria-live="polite">
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>{t('loading')}</p>
          ) : chat.length === 0 && !pending ? (
            <div className="mx-auto max-w-2xl py-6">
              <p className="tech-label fade-up" style={{ color: 'var(--line)' }}>
                {lang === 'he' ? 'מוכן לניתוח' : 'Ready'}
              </p>
              <p className="fade-up mt-2 text-xl" style={{ color: 'var(--text-secondary)', ['--delay' as string]: '0.05s' }}>
                {expert.summary[lang]}
              </p>
              <div className="dim-ticks mb-4 mt-8">
                <div className="dim-line">
                  <span>{t('suggested')}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {expert.starters[lang].map((starter, i) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => setDraft(starter)}
                    className="bp-card fade-up group flex items-center gap-3 rounded-lg border px-4 py-3 text-start text-sm"
                    style={{ borderColor: 'var(--border)', background: 'rgba(6,16,29,0.5)', ['--delay' as string]: `${0.1 + i * 0.06}s` }}
                  >
                    <span className="mono shrink-0 text-xs" style={{ color: 'var(--line)' }} dir="ltr">
                      Q{i + 1}
                    </span>
                    <span className="flex-1">{starter}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ol className="mx-auto flex max-w-3xl flex-col gap-5">
              {messages.map((m) =>
                m.kind === 'report' ? (
                  <li key={m.id}>
                    <ReportChip message={m} label={t('report')} action={t('viewReport')} onOpen={() => setOpenReport(m)} date={dateFormat.format(new Date(m.created_at))} />
                  </li>
                ) : (
                  <li key={m.id}>
                    <ChatBubble message={m} youLabel={t('you')} expertLabel={expert.name[lang]} sourcesLabel={t('sources')} />
                  </li>
                ),
              )}
              {pending && (
                <li>
                  {pending.text && pending.mode === 'chat' ? (
                    <ChatBubble
                      message={{ id: 'pending', role: 'assistant', kind: 'chat', content: pending.text, sources: [], created_at: '' }}
                      youLabel={t('you')}
                      expertLabel={expert.name[lang]}
                      sourcesLabel={t('sources')}
                    />
                  ) : null}
                  <div className="mt-3 max-w-sm">
                    <p className="mb-2 flex items-center gap-2 text-sm" style={{ color: 'var(--line)' }}>
                      {pending.status === 'searching' ? (
                        <Search className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      )}
                      {pending.mode === 'report' ? t('generatingReport') : statusLabel[pending.status]}
                    </p>
                    <div className="scan-bar" aria-hidden="true" />
                  </div>
                </li>
              )}
            </ol>
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div
            role="alert"
            className="mx-4 mb-2 flex items-start justify-between gap-2 whitespace-pre-line rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--status-critical)', color: 'var(--status-critical)', background: 'rgba(255,122,114,0.08)' }}
          >
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} aria-label={t('close')}>
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        <form
          className="border-t p-3"
          style={{ borderColor: 'var(--border)' }}
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <div
            className="flex items-end gap-2 rounded-lg border p-2 transition-shadow focus-within:border-[var(--brand)] focus-within:shadow-[var(--glow-brand)]"
            style={{ borderColor: 'var(--border-strong)', background: 'rgba(6,16,29,0.7)' }}
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-md transition-colors hover:bg-[rgba(108,182,255,0.1)] disabled:opacity-50"
              aria-label={t('upload')}
              title={t('upload')}
            >
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <FileUp className="h-5 w-5" aria-hidden="true" />}
            </button>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={Math.min(8, Math.max(1, draft.split('\n').length))}
              placeholder={t('askPlaceholder')}
              aria-label={t('askPlaceholder')}
              className="max-h-60 flex-1 resize-none bg-transparent px-1 py-2 outline-none"
            />
            {pending ? (
              <button
                type="button"
                onClick={() => abortRef.current?.abort()}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-md border"
                style={{ borderColor: 'var(--border-strong)' }}
                aria-label={t('stop')}
                title={t('stop')}
              >
                <Square className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!draft.trim()}
                className="btn-accent grid h-10 w-10 shrink-0 place-items-center rounded-md disabled:opacity-40"
                aria-label={t('send')}
                title={t('send')}
              >
                <Send className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
              </button>
            )}
          </div>
          <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            {t('disclaimer')}
          </p>
        </form>
      </section>

      {/* Documents and reports */}
      <aside className="flex flex-col gap-4">
        <section className="bp-panel bp-corners p-4">
          <p className="tech-label">INPUT</p>
          <h2 className="mb-3 mt-1 flex items-center justify-between font-bold">
            {t('documents')}
            {documents.length > 0 && (
              <span className="mono rounded border px-1.5 text-xs" style={{ borderColor: 'var(--border)', color: 'var(--line)' }}>
                {documents.length}
              </span>
            )}
          </h2>
          {documents.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {t('noDocuments')}
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center gap-2 rounded-md border px-2 py-1.5" style={{ borderColor: 'var(--border)', background: 'rgba(6,16,29,0.5)' }}>
                  <DocIcon name={doc.name} mediaType={doc.media_type} />
                  <span className="min-w-0 flex-1">
                    <span dir="auto" className="block truncate text-start text-sm" title={doc.name}>
                      {splitFileName(doc.name).base}
                    </span>
                    <span className="mono block text-xs" style={{ color: 'var(--text-muted)' }}>
                      {[splitFileName(doc.name).ext, formatBytes(doc.size_bytes)].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemove(doc)}
                    className="grid h-7 w-7 place-items-center rounded transition-colors hover:bg-[rgba(255,122,114,0.1)] hover:text-[var(--status-critical)]"
                    aria-label={`${t('remove')} ${doc.name}`}
                    title={t('remove')}
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-dashed px-3 py-3 text-sm font-medium transition-colors hover:border-[var(--line)] hover:bg-[rgba(79,209,232,0.06)] disabled:opacity-60"
            style={{ borderColor: 'var(--border-strong)' }}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <FileUp className="h-4 w-4" aria-hidden="true" />}
            {uploading ? t('uploading') : t('upload')}
          </button>
          <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            {t('acceptedFiles')}
          </p>
        </section>

        <section className="bp-panel bp-corners p-4">
          <p className="tech-label">OUTPUT</p>
          <h2 className="mb-3 mt-1 font-bold">{t('reports')}</h2>
          <button
            type="button"
            onClick={() => run('report')}
            disabled={!canReport}
            title={canReport ? undefined : t('reportNeedsContent')}
            className="btn-accent flex w-full items-center justify-center gap-2 rounded-md px-3 py-3 text-sm font-bold disabled:opacity-50"
          >
            {pending?.mode === 'report' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ScrollText className="h-4 w-4" aria-hidden="true" />}
            {pending?.mode === 'report' ? t('generatingReport') : t('generateReport')}
          </button>
          {!canReport && !pending && (
            <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              {t('reportNeedsContent')}
            </p>
          )}
          {reports.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1">
              {reports.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setOpenReport(r)}
                    className="flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-start text-sm transition-colors hover:bg-[rgba(108,182,255,0.08)]"
                  >
                    <ScrollText className="h-4 w-4 shrink-0" style={{ color: 'var(--accent)' }} aria-hidden="true" />
                    <span dir="auto" className="truncate text-start">{reportTitle(r.content) ?? t('report')}</span>
                    <span className="mono ms-auto shrink-0 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {dateFormat.format(new Date(r.created_at))}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>

      {openReport && <ReportView report={openReport} expert={expert} onClose={() => setOpenReport(null)} />}
    </div>
  );
}

function ChatBubble({
  message,
  youLabel,
  expertLabel,
  sourcesLabel,
}: {
  message: Message;
  youLabel: string;
  expertLabel: string;
  sourcesLabel: string;
}) {
  const isUser = message.role === 'user';
  return (
    <article className={isUser ? 'ms-auto max-w-[85%]' : 'max-w-full'}>
      <p className="tech-label mb-1.5 flex items-center gap-1.5" style={isUser ? undefined : { color: 'var(--line)' }}>
        {!isUser && <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: 'var(--line)' }} aria-hidden="true" />}
        {isUser ? youLabel : expertLabel}
      </p>
      <div
        dir={isUser ? 'auto' : undefined}
        className={isUser ? 'whitespace-pre-wrap rounded-lg border px-4 py-3 text-start' : 'border-s-2 ps-4'}
        style={
          isUser
            ? { background: 'rgba(108,182,255,0.1)', borderColor: 'rgba(108,182,255,0.25)' }
            : { borderColor: 'rgba(79,209,232,0.35)' }
        }
      >
        {isUser ? message.content : <Markdown>{message.content}</Markdown>}
      </div>
      {message.sources.length > 0 && (
        <details className="mt-2 text-sm">
          <summary className="cursor-pointer font-medium" style={{ color: 'var(--text-secondary)' }}>
            {sourcesLabel} ({message.sources.length})
          </summary>
          <ul className="mt-1 flex flex-col gap-1 ps-1">
            {message.sources.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 underline"
                  style={{ color: 'var(--brand)' }}
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}

function ReportChip({ message, label, action, date, onOpen }: { message: Message; label: string; action: string; date: string; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="bp-card flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-start hover:border-[var(--accent)]"
      style={{ borderColor: 'rgba(255,181,71,0.3)', background: 'var(--accent-soft)' }}
    >
      <ScrollText className="h-5 w-5 shrink-0" style={{ color: 'var(--accent)' }} aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span dir="auto" className="block truncate text-start font-bold">{reportTitle(message.content) ?? label}</span>
        <span className="mono block text-xs" style={{ color: 'var(--text-muted)' }}>
          {label} · {date}
        </span>
      </span>
      <span className="shrink-0 text-sm font-bold" style={{ color: 'var(--accent)' }}>
        {action}
      </span>
    </button>
  );
}

function DocIcon({ name, mediaType }: { name: string; mediaType: string }) {
  const ext = name.split('.').pop()?.toLowerCase();
  const Icon = mediaType.startsWith('image/') ? FileImage : ext === 'xlsx' || ext === 'csv' ? FileSpreadsheet : FileText;
  return <Icon className="h-5 w-5 shrink-0" style={{ color: 'var(--text-secondary)' }} aria-hidden="true" />;
}

/** Name without extension; the type goes in the subline so bidi text never reorders "02.pdf". */
function splitFileName(name: string): { base: string; ext: string } {
  const dot = name.lastIndexOf('.');
  if (dot <= 0) return { base: name, ext: '' };
  return { base: name.slice(0, dot), ext: name.slice(dot + 1).toUpperCase() };
}

function reportTitle(markdown: string): string | null {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}
