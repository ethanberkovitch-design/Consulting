export function DisclaimerBanner() {
  return (
    <div
      role="note"
      className="flex gap-3 rounded-2xl border px-4 py-3 text-sm leading-relaxed"
      style={{
        borderColor: 'color-mix(in srgb, var(--status-warning) 55%, transparent)',
        background: 'color-mix(in srgb, var(--status-warning) 14%, var(--surface-1))',
        color: 'var(--text-primary)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <span aria-hidden="true" className="text-lg leading-none">⚠️</span>
      <p>
        <strong>כלי הדגמה וניתוח בלבד — אינו ייעוץ פנסיוני.</strong> החישובים כאן מבוססים על נתונים ותשואות
        לדוגמה, ואינם מהווים המלצה לביצוע פעולה במוצר פנסיוני כלשהו, ייעוץ פנסיוני, שיווק פנסיוני או תחליף
        לייעוץ אצל בעל רישיון כדין. תשואות עבר אינן מבטיחות תשואה עתידית.
      </p>
    </div>
  );
}
