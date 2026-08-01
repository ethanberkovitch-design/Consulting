import { useEffect, useMemo, useState } from 'react';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { InputForm } from './components/InputForm';
import { ProjectionChart } from './components/ProjectionChart';
import { ComparisonTable } from './components/ComparisonTable';
import { FeeImpactCallout } from './components/FeeImpactCallout';
import { MarketInsights } from './components/MarketInsights';
import { AuthPanel } from './components/AuthPanel';
import { DocumentUpload } from './components/DocumentUpload';
import { investmentTracks } from './data/investmentTracks';
import { buildTrackProjection } from './lib/calculations';
import { formatCurrency } from './lib/format';
import { useAuth } from './hooks/useAuth';
import { useProfile } from './hooks/useProfile';
import type { PlannerInputs } from './types';

const defaultInputs: PlannerInputs = {
  currentAge: 35,
  retirementAge: 67,
  currentBalance: 150000,
  monthlySalary: 14000,
  contributionRate: 0.185,
  selectedTrackIds: ['general', 'stocks'],
  actualDepositFee: null,
  actualBalanceFee: null,
};

function App() {
  const [inputs, setInputs] = useState<PlannerInputs>(defaultInputs);
  const { user } = useAuth();
  const { load, save, saving, savedAt } = useProfile(user?.id ?? null);

  useEffect(() => {
    if (!user) return;
    load().then((saved) => {
      if (saved) setInputs(saved);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const selectedTracks = useMemo(
    () => investmentTracks.filter((t) => inputs.selectedTrackIds.includes(t.id)),
    [inputs.selectedTrackIds],
  );

  const medianProjections = useMemo(
    () => selectedTracks.map((track) => buildTrackProjection(inputs, track, 'medium')),
    [inputs, selectedTracks],
  );

  const yearsToRetirement = Math.max(0, inputs.retirementAge - inputs.currentAge);
  const headlineBalance = medianProjections[0]?.finalBalance ?? inputs.currentBalance;

  const applyPatch = (patch: Partial<PlannerInputs>) => {
    setInputs((prev) => {
      const next = { ...prev };
      (Object.keys(patch) as (keyof PlannerInputs)[]).forEach((key) => {
        const value = patch[key];
        if (value !== undefined) {
          (next as Record<string, unknown>)[key] = value;
        }
      });
      return next;
    });
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-7 px-4 py-8 sm:px-6" style={{ color: 'var(--text-primary)' }}>
      <header className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-lg"
            style={{ background: 'var(--brand-gradient)', boxShadow: 'var(--shadow-pop)' }}
            aria-hidden="true"
          >
            🌱
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              <span className="brand-text">סוכן פנסיוני</span> חכם
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              בדקו איך הכסף שלכם יכול לגדול — לפי מסלולים, דמי ניהול ותרחישי שוק
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div
            className="rounded-2xl p-4 text-white shadow-lg"
            style={{ background: 'var(--brand-gradient)', boxShadow: 'var(--shadow-pop)' }}
          >
            <div className="text-xs font-medium opacity-90">צבירה צפויה בפרישה</div>
            <div className="mt-1 text-2xl font-extrabold tabular-nums">{formatCurrency(headlineBalance)}</div>
          </div>
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', boxShadow: 'var(--shadow-card)' }}
          >
            <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              שנים עד הפרישה
            </div>
            <div className="mt-1 text-2xl font-extrabold tabular-nums">{yearsToRetirement}</div>
          </div>
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', boxShadow: 'var(--shadow-card)' }}
          >
            <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              מסלולים בהשוואה
            </div>
            <div className="mt-1 text-2xl font-extrabold tabular-nums">{selectedTracks.length}</div>
          </div>
        </div>
      </header>

      <AuthPanel user={user} onSignedIn={() => load().then((saved) => saved && setInputs(saved))} onSave={() => save(inputs)} saving={saving} savedAt={savedAt} />

      <DocumentUpload user={user} onApply={applyPatch} />

      <DisclaimerBanner />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        <InputForm inputs={inputs} onChange={setInputs} tracks={investmentTracks} />

        <div className="flex flex-col gap-6">
          <ProjectionChart projections={medianProjections} />
          <ComparisonTable inputs={inputs} tracks={selectedTracks} />
          <FeeImpactCallout inputs={inputs} tracks={selectedTracks} />
          <MarketInsights inputs={inputs} tracks={selectedTracks} />
        </div>
      </div>

      <footer className="mt-4 border-t pt-4 text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
        Innovation&amp;More — כלי פנימי להדגמה. הנתונים בכלי זה הם נתוני דוגמה ואינם מהווים ייעוץ פנסיוני מוסמך.
      </footer>
    </div>
  );
}

export default App;
