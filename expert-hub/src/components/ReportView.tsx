import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Download, Printer, X } from 'lucide-react';
import { Markdown } from './Markdown';
import { useI18n } from '../lib/i18n';
import type { Message } from '../lib/api';
import type { ExpertCard } from '../experts/registry';

interface ReportViewProps {
  report: Message;
  expert: ExpertCard;
  onClose: () => void;
}

/**
 * Full-screen report sheet. "Save as PDF" uses the browser's print engine,
 * which renders Hebrew RTL text and tables correctly — client-side PDF
 * libraries still mangle bidirectional text.
 */
export function ReportView({ report, expert, onClose }: ReportViewProps) {
  const { t, lang } = useI18n();
  const date = new Intl.DateTimeFormat(lang === 'he' ? 'he-IL' : 'en-GB', { dateStyle: 'long' }).format(
    new Date(report.created_at),
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.classList.add('print-root');
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.classList.remove('print-root');
    };
  }, [onClose]);

  const downloadMarkdown = () => {
    const blob = new Blob([report.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${expert.id}-report-${report.created_at.slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return createPortal(
    <div
      className="print-layer fixed inset-0 z-50 overflow-y-auto px-4 py-6"
      style={{ background: 'var(--page)' }}
      role="dialog"
      aria-modal="true"
      aria-label={t('report')}
    >
      <div className="no-print mx-auto mb-4 flex max-w-4xl flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-bold"
          style={{ background: 'var(--brand)', color: 'var(--on-brand)' }}
        >
          <Printer className="h-4 w-4" aria-hidden="true" />
          {t('printPdf')}
        </button>
        <button
          type="button"
          onClick={downloadMarkdown}
          className="flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium"
          style={{ borderColor: 'var(--border-strong)', background: 'var(--surface-1)' }}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          {t('downloadMd')}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium"
          style={{ borderColor: 'var(--border-strong)', background: 'var(--surface-1)' }}
        >
          <X className="h-4 w-4" aria-hidden="true" />
          {t('close')}
        </button>
      </div>

      <article
        className="print-sheet mx-auto max-w-4xl rounded-xl border px-6 py-8 md:px-12 md:py-10"
        style={{ background: 'var(--surface-1)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
      >
        <header
          className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b pb-4 text-sm"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
            {expert.name[lang]}
          </span>
          <span>{date}</span>
        </header>

        <Markdown>{report.content}</Markdown>

        {report.sources.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-2 text-base font-bold">{t('sources')}</h2>
            <ol className="list-decimal ps-5 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {report.sources.map((s) => (
                <li key={s.url} className="break-all">
                  {s.title} — <span dir="ltr">{s.url}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <footer className="mt-10 border-t pt-4 text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          <p>{t('reportDisclaimer')}</p>
          <p className="mt-1">{t('preparedBy')}</p>
        </footer>
      </article>
    </div>,
    document.body,
  );
}
