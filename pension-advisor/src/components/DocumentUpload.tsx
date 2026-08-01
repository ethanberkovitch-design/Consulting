import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { useDocuments } from '../hooks/useDocuments';
import { extractTextFromPdf, parsePensionStatement, type ExtractedStatementData } from '../lib/pdfParser';
import { formatCurrency, formatPercent } from '../lib/format';
import type { PlannerInputs } from '../types';

interface DocumentUploadProps {
  user: User | null;
  onApply: (patch: Partial<PlannerInputs>) => void;
}

const emptyExtracted: ExtractedStatementData = { balance: null, depositFee: null, balanceFee: null, fundName: null };

export function DocumentUpload({ user, onApply }: DocumentUploadProps) {
  const { documents, upload, remove } = useDocuments(user?.id ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [extracted, setExtracted] = useState<ExtractedStatementData>(emptyExtracted);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'reviewing' | 'saving' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setStatus('parsing');
    setError(null);
    try {
      const text = await extractTextFromPdf(selected);
      setExtracted(parsePensionStatement(text));
      setStatus('reviewing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'לא הצלחנו לקרוא את הקובץ');
      setStatus('error');
    }
  };

  const handleApply = () => {
    onApply({
      currentBalance: extracted.balance ?? undefined,
      actualDepositFee: extracted.depositFee ?? undefined,
      actualBalanceFee: extracted.balanceFee ?? undefined,
    });
  };

  const handleSave = async () => {
    if (!file) return;
    setStatus('saving');
    try {
      await upload(file, extracted);
      setStatus('idle');
      setFile(null);
      setExtracted(emptyExtracted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שמירת המסמך נכשלה');
      setStatus('error');
    }
  };

  return (
    <div
      className="rounded-3xl border p-5"
      style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', boxShadow: 'var(--shadow-card)' }}
    >
      <h2 className="mb-1 flex items-center gap-2 text-lg font-bold">
        <span aria-hidden="true">📄</span> העלאת תדפיס שנתי (PDF)
      </h2>
      <p className="mb-4 text-sm" style={{ color: 'var(--text-muted)' }}>
        נחלץ אוטומטית יתרה, דמי ניהול ומסלול מתוך המסמך שלכם — אבל תמיד תבדקו ותתקנו לפני שמירה. הקובץ
        נשמר בחשבון הפרטי והמאובטח שלכם בלבד.
      </p>

      <label
        className="mb-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-sm"
        style={{ borderColor: 'var(--brand-1)', background: 'var(--surface-2)', color: 'var(--text-secondary)' }}
      >
        <span aria-hidden="true" className="text-2xl">
          ⬆️
        </span>
        {file ? file.name : 'לחצו לבחירת קובץ PDF'}
        <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
      </label>

      {status === 'parsing' && (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          קורא את המסמך...
        </p>
      )}

      {status === 'error' && error && (
        <p className="text-sm font-medium" style={{ color: 'var(--status-critical)' }}>
          {error}
        </p>
      )}

      {(status === 'reviewing' || status === 'saving') && (
        <div className="flex flex-col gap-3">
          <div
            className="flex flex-col gap-2 rounded-2xl p-3 text-sm"
            style={{ background: 'color-mix(in srgb, var(--status-warning) 12%, var(--surface-1))' }}
          >
            <span className="font-bold">ערכים שזוהו — בדקו לפני שימוש:</span>
            <label className="flex items-center justify-between gap-2">
              <span>יתרה צבורה</span>
              <input
                type="number"
                value={extracted.balance ?? ''}
                onChange={(e) => setExtracted((s) => ({ ...s, balance: e.target.value === '' ? null : Number(e.target.value) }))}
                className="w-32 rounded-lg border px-2 py-1 text-right"
                style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}
              />
            </label>
            <label className="flex items-center justify-between gap-2">
              <span>דמי ניהול מהפקדה (%)</span>
              <input
                type="number"
                step={0.01}
                value={extracted.depositFee !== null ? extracted.depositFee * 100 : ''}
                onChange={(e) =>
                  setExtracted((s) => ({ ...s, depositFee: e.target.value === '' ? null : Number(e.target.value) / 100 }))
                }
                className="w-32 rounded-lg border px-2 py-1 text-right"
                style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}
              />
            </label>
            <label className="flex items-center justify-between gap-2">
              <span>דמי ניהול מצבירה (%)</span>
              <input
                type="number"
                step={0.01}
                value={extracted.balanceFee !== null ? extracted.balanceFee * 100 : ''}
                onChange={(e) =>
                  setExtracted((s) => ({ ...s, balanceFee: e.target.value === '' ? null : Number(e.target.value) / 100 }))
                }
                className="w-32 rounded-lg border px-2 py-1 text-right"
                style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}
              />
            </label>
            {!extracted.balance && !extracted.depositFee && !extracted.balanceFee && (
              <span style={{ color: 'var(--text-muted)' }}>
                לא הצלחנו לזהות ערכים אוטומטית מהמסמך הזה — אפשר להזין ידנית.
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleApply}
              className="rounded-full px-4 py-2 text-sm font-bold text-white"
              style={{ background: 'var(--brand-gradient)' }}
            >
              החל על הטופס שלי
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={status === 'saving'}
              className="rounded-full border px-4 py-2 text-sm font-bold disabled:opacity-60"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              {status === 'saving' ? 'שומר...' : 'שמור מסמך בחשבון שלי'}
            </button>
          </div>
        </div>
      )}

      {documents.length > 0 && (
        <div className="mt-5 flex flex-col gap-2">
          <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
            מסמכים שהעליתי
          </span>
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs"
              style={{ background: 'var(--surface-2)' }}
            >
              <span className="font-medium">{doc.file_name}</span>
              <span style={{ color: 'var(--text-muted)' }}>
                {doc.extracted_balance ? formatCurrency(doc.extracted_balance) : '—'} ·{' '}
                {doc.extracted_deposit_fee ? formatPercent(doc.extracted_deposit_fee) : '—'} /{' '}
                {doc.extracted_balance_fee ? formatPercent(doc.extracted_balance_fee) : '—'}
              </span>
              <button
                type="button"
                onClick={() => remove(doc)}
                className="font-bold"
                style={{ color: 'var(--status-critical)' }}
              >
                מחק
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
