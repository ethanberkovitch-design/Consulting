import { useMemo, useState } from 'react';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { InputForm } from './components/InputForm';
import { ProjectionChart } from './components/ProjectionChart';
import { ComparisonTable } from './components/ComparisonTable';
import { FeeImpactCallout } from './components/FeeImpactCallout';
import { investmentTracks } from './data/investmentTracks';
import { buildTrackProjection } from './lib/calculations';
import type { PlannerInputs } from './types';

const defaultInputs: PlannerInputs = {
  currentAge: 35,
  retirementAge: 67,
  currentBalance: 150000,
  monthlySalary: 14000,
  contributionRate: 0.185,
  selectedTrackIds: ['general', 'stocks'],
};

function App() {
  const [inputs, setInputs] = useState<PlannerInputs>(defaultInputs);

  const selectedTracks = useMemo(
    () => investmentTracks.filter((t) => inputs.selectedTrackIds.includes(t.id)),
    [inputs.selectedTrackIds],
  );

  const medianProjections = useMemo(
    () => selectedTracks.map((track) => buildTrackProjection(inputs, track, 'medium')),
    [inputs, selectedTracks],
  );

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6" style={{ color: 'var(--text-primary)' }}>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">סוכן פנסיוני — כלי ניתוח והדגמה</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          מדמה צבירה פנסיונית לפי מסלולי השקעה, דמי ניהול ותרחישי תשואה שונים
        </p>
      </header>

      <DisclaimerBanner />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        <InputForm inputs={inputs} onChange={setInputs} tracks={investmentTracks} />

        <div className="flex flex-col gap-6">
          <ProjectionChart projections={medianProjections} />
          <ComparisonTable inputs={inputs} tracks={selectedTracks} />
          <FeeImpactCallout inputs={inputs} tracks={selectedTracks} />
        </div>
      </div>

      <footer className="mt-4 border-t pt-4 text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
        Innovation&amp;More — כלי פנימי להדגמה. הנתונים בכלי זה הם נתוני דוגמה ואינם מהווים ייעוץ פנסיוני מוסמך.
      </footer>
    </div>
  );
}

export default App;
