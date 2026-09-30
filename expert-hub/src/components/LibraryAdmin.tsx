import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, FileText, Loader2, RefreshCw, Trash2, Upload } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { ACCEPT, MAX_FILE_BYTES, UnsupportedFileError, formatBytes, prepareFile } from '../lib/files';
import {
  LIBRARY_MAX_BYTES,
  LIBRARY_WARN_TOKENS,
  countLibraryTokens,
  deleteLibraryFile,
  libraryCostPerQuestion,
  listLibrary,
  renameLibraryFile,
  setLibraryActive,
  uploadLibraryFile,
  type LibraryRow,
} from '../lib/library';
import { CATEGORY_COLOR, CATEGORY_ORDER, EXPERTS, type ExpertId } from '../experts/registry';

const usd = (value: number) => (value < 0.01 && value > 0 ? '<$0.01' : `$${value.toFixed(2)}`);

export function LibraryAdmin({ onBack }: { onBack: () => void }) {
  const { t, lang, dir } = useI18n();
  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const experts = useMemo(
    () => [...EXPERTS].sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)),
    [],
  );
  const [rows, setRows] = useState<LibraryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [expertId, setExpertId] = useState<ExpertId>(experts[0].id);
  const [title, setTitle] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const number = new Intl.NumberFormat(lang === 'he' ? 'he-IL' : 'en-GB');

  const reload = useCallback(async () => {
    try {
      setRows(await listLibrary());
    } catch (err) {
      setError(err instanceof Error ? err.message : t('somethingWrong'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const activeBytes = (id: ExpertId, except?: string) =>
    rows.filter((r) => r.expert_id === id && r.active && r.id !== except).reduce((sum, r) => sum + r.size_bytes, 0);

  const withBusy = async (id: string, work: () => Promise<void>) => {
    setBusy((prev) => new Set(prev).add(id));
    setError(null);
    try {
      await work();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('somethingWrong'));
    } finally {
      setBusy((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await reload();
    }
  };

  /** Counts tokens, then turns the file on. A file the model cannot read stays off. */
  const countAndActivate = async (row: LibraryRow) => {
    try {
      await countLibraryTokens(row);
    } catch (err) {
      throw new Error(`${t('libraryCountFailed')} ${row.title} (${err instanceof Error ? err.message : ''})`);
    }
    if (activeBytes(row.expert_id, row.id) + row.size_bytes > LIBRARY_MAX_BYTES) throw new Error(t('libraryOverBudget'));
    await setLibraryActive(row, true);
  };

  const handleUpload = async (event: FormEvent) => {
    event.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setError(null);
    if (file.size > MAX_FILE_BYTES) {
      setError(`${t('fileTooLarge')} ${file.name}`);
      return;
    }
    setUploading(true);
    try {
      const prepared = await prepareFile(file);
      if (activeBytes(expertId) + prepared.blob.size > LIBRARY_MAX_BYTES) throw new Error(t('libraryOverBudget'));
      const row = await uploadLibraryFile(expertId, title.trim() || file.name.replace(/\.[^.]+$/, ''), prepared);
      setRows((prev) => [...prev, row]);
      setTitle('');
      if (fileRef.current) fileRef.current.value = '';
      await withBusy(row.id, () => countAndActivate(row));
    } catch (err) {
      setError(
        err instanceof UnsupportedFileError
          ? `${t('fileUnsupported')} ${file.name}`
          : err instanceof Error
            ? err.message
            : t('somethingWrong'),
      );
      await reload();
    } finally {
      setUploading(false);
    }
  };

  const toggle = (row: LibraryRow) =>
    withBusy(row.id, async () => {
      if (row.active) return setLibraryActive(row, false);
      if (row.token_count === null) return countAndActivate(row);
      if (activeBytes(row.expert_id) + row.size_bytes > LIBRARY_MAX_BYTES) throw new Error(t('libraryOverBudget'));
      await setLibraryActive(row, true);
    });

  const remove = (row: LibraryRow) => {
    if (!window.confirm(t('libraryConfirmDelete'))) return;
    void withBusy(row.id, () => deleteLibraryFile(row));
  };

  const rename = (row: LibraryRow, next: string) => {
    const value = next.trim();
    if (!value || value === row.title) return;
    void withBusy(row.id, () => renameLibraryFile(row, value));
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <button
        type="button"
        onClick={onBack}
        className="btn-line mb-5 flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium"
      >
        <BackIcon className="h-4 w-4" aria-hidden="true" />
        {t('backHome')}
      </button>
      <p className="tech-label" style={{ color: 'var(--line)' }}>
        ADMIN · LIBRARY
      </p>
      <h1 className="mt-2 text-3xl font-extrabold">{t('library')}</h1>
      <p className="mt-2 max-w-3xl" style={{ color: 'var(--text-secondary)' }}>
        {t('libraryIntro')}
      </p>
      <p className="mt-3 flex max-w-3xl items-start gap-2 text-sm" style={{ color: 'var(--status-warning)' }}>
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        {t('libraryCopyright')}
      </p>

      <form onSubmit={handleUpload} className="bp-panel bp-corners mt-6 grid gap-3 p-4 md:grid-cols-[1fr_1.4fr_1.4fr_auto] md:items-end">
        <label className="flex flex-col gap-1 text-sm">
          <span style={{ color: 'var(--text-secondary)' }}>{t('libraryExpert')}</span>
          <select
            value={expertId}
            onChange={(e) => setExpertId(e.target.value as ExpertId)}
            className="h-10 rounded-md border px-2"
            style={{ background: 'var(--surface-1)', borderColor: 'var(--border)' }}
          >
            {experts.map((expert) => (
              <option key={expert.id} value={expert.id}>
                {expert.name[lang]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span style={{ color: 'var(--text-secondary)' }}>{t('libraryTitle')}</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('libraryTitleHint')}
            dir="auto"
            className="h-10 rounded-md border px-3"
            style={{ background: 'var(--surface-1)', borderColor: 'var(--border)' }}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span style={{ color: 'var(--text-secondary)' }}>{t('libraryFile')}</span>
          <input ref={fileRef} type="file" accept={ACCEPT} required className="h-10 text-sm file:me-3 file:rounded-md file:border-0 file:px-3 file:py-2" />
        </label>
        <button
          type="submit"
          disabled={uploading}
          className="btn-accent flex h-10 items-center justify-center gap-2 rounded-md px-4 font-bold disabled:opacity-60"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}
          {uploading ? t('uploading') : t('libraryAdd')}
        </button>
        <p className="text-xs md:col-span-4" style={{ color: 'var(--text-muted)' }}>
          {t('acceptedFiles')}
        </p>
      </form>

      {error && (
        <p role="alert" className="mt-4 whitespace-pre-line text-sm" style={{ color: 'var(--status-critical)' }}>
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-8" style={{ color: 'var(--text-muted)' }}>
          {t('loading')}
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {experts.map((expert) => {
            const files = rows.filter((r) => r.expert_id === expert.id);
            const active = files.filter((r) => r.active);
            const bytes = active.reduce((sum, r) => sum + r.size_bytes, 0);
            const tokens = active.reduce((sum, r) => sum + (r.token_count ?? 0), 0);
            const cost = libraryCostPerQuestion(tokens);
            const share = Math.min(1, bytes / LIBRARY_MAX_BYTES);
            return (
              <section key={expert.id} className="bp-panel p-4">
                <header className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 font-bold">
                    <expert.icon className="h-5 w-5" style={{ color: CATEGORY_COLOR[expert.category] }} aria-hidden="true" />
                    {expert.name[lang]}
                  </h2>
                  <div className="mono flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--text-muted)' }} dir="ltr">
                    <span>
                      {formatBytes(bytes)} / {formatBytes(LIBRARY_MAX_BYTES)}
                    </span>
                    <span>
                      {number.format(tokens)} {t('libraryTokens')}
                    </span>
                  </div>
                </header>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--surface-2)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${share * 100}%`,
                      background: share > 0.85 ? 'var(--status-critical)' : share > 0.6 ? 'var(--status-warning)' : 'var(--status-good)',
                    }}
                  />
                </div>
                {tokens > 0 && (
                  <p className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {t('libraryPerQuestion')}: {usd(cost.first)} {t('libraryFirstQuestion')} · {usd(cost.cached)} {t('libraryCachedQuestion')}
                  </p>
                )}
                {tokens > LIBRARY_WARN_TOKENS && (
                  <p className="mt-2 flex items-start gap-2 text-xs" style={{ color: 'var(--status-warning)' }}>
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {t('libraryWarnTokens')}
                  </p>
                )}

                {files.length === 0 ? (
                  <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                    {t('libraryEmpty')}
                  </p>
                ) : (
                  <ul className="mt-3 flex flex-col divide-y" style={{ borderColor: 'var(--border)' }}>
                    {files.map((row) => {
                      const isBusy = busy.has(row.id);
                      return (
                        <li key={row.id} className="flex flex-wrap items-center gap-3 py-2" style={{ borderColor: 'var(--border)', opacity: row.active ? 1 : 0.65 }}>
                          <FileText className="h-4 w-4 shrink-0" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
                          <input
                            defaultValue={row.title}
                            onBlur={(e) => rename(row, e.target.value)}
                            aria-label={t('libraryTitle')}
                            dir="auto"
                            className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm font-medium hover:border-[var(--border)] focus:border-[var(--border-strong)]"
                          />
                          <span className="mono text-xs" style={{ color: 'var(--text-muted)' }} dir="ltr">
                            {formatBytes(row.size_bytes)} ·{' '}
                            {isBusy && row.token_count === null
                              ? t('libraryCounting')
                              : row.token_count === null
                                ? t('libraryNotCounted')
                                : `${number.format(row.token_count)} ${t('libraryTokens')}`}
                          </span>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void withBusy(row.id, async () => void (await countLibraryTokens(row)))}
                            className="btn-line grid h-8 w-8 place-items-center rounded-md disabled:opacity-50"
                            aria-label={t('libraryRecount')}
                            title={t('libraryRecount')}
                          >
                            <RefreshCw className={`h-3.5 w-3.5 ${isBusy ? 'animate-spin' : ''}`} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={row.active}
                            disabled={isBusy}
                            onClick={() => void toggle(row)}
                            className="btn-line h-8 min-w-16 rounded-md px-2 text-xs font-bold disabled:opacity-50"
                            style={{ color: row.active ? 'var(--status-good)' : 'var(--text-muted)' }}
                          >
                            {row.active ? t('libraryActive') : t('libraryInactive')}
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => remove(row)}
                            className="btn-line grid h-8 w-8 place-items-center rounded-md disabled:opacity-50"
                            aria-label={t('libraryDelete')}
                            title={t('libraryDelete')}
                            style={{ color: 'var(--status-critical)' }}
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
