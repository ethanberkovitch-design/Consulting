import type { InvestmentTrack } from '../types';

/**
 * נתונים לדוגמה בלבד — אינם מבוססים על נתוני קרן פנסיה ספציפית.
 * דמי הניהול והתשואות הריאליות הן הנחות אילוסטרטיביות סבירות לצורך הדגמה,
 * לא נתונים רגולטוריים בפועל מרשות שוק ההון, ביטוח וחיסכון.
 */
export const investmentTracks: InvestmentTrack[] = [
  {
    id: 'stocks',
    name: 'מסלול מנייתי',
    description: 'חשיפה גבוהה למניות (עד כ-120%). תנודתיות גבוהה, פוטנציאל תשואה גבוה יותר לטווח ארוך.',
    riskLevel: 'גבוה',
    color: 'var(--series-1)',
    feeFromDeposit: 0.012,
    feeFromBalance: 0.003,
    expectedReturn: { conservative: 0.04, medium: 0.065, optimistic: 0.09 },
  },
  {
    id: 'general',
    name: 'מסלול כללי (ברירת מחדל)',
    description: 'תמהיל מאוזן של מניות, אג"ח ונכסים נוספים. המסלול הנפוץ ביותר בישראל.',
    riskLevel: 'בינוני',
    color: 'var(--series-2)',
    feeFromDeposit: 0.01,
    feeFromBalance: 0.003,
    expectedReturn: { conservative: 0.03, medium: 0.05, optimistic: 0.07 },
  },
  {
    id: 'bonds',
    name: "מסלול אג\"חי",
    description: 'רוב הנכסים באג"ח (ממשלתי וקונצרני). תנודתיות נמוכה יחסית.',
    riskLevel: 'נמוך',
    color: 'var(--series-3)',
    feeFromDeposit: 0.008,
    feeFromBalance: 0.002,
    expectedReturn: { conservative: 0.015, medium: 0.03, optimistic: 0.045 },
  },
  {
    id: 'shekel',
    name: 'מסלול שקלי (ללא מניות)',
    description: 'ללא חשיפה למניות. מיועד בעיקר למבוטחים קרובים לגיל פרישה.',
    riskLevel: 'נמוך מאוד',
    color: 'var(--series-4)',
    feeFromDeposit: 0.006,
    feeFromBalance: 0.0015,
    expectedReturn: { conservative: 0.01, medium: 0.02, optimistic: 0.03 },
  },
  {
    id: 'halachic',
    name: 'מסלול הלכתי',
    description: 'השקעה על פי כללי ההלכה היהודית (ללא ריבית, עם פיקוח הלכתי). חשיפה מנייתית משמעותית.',
    riskLevel: 'בינוני-גבוה',
    color: 'var(--series-5)',
    feeFromDeposit: 0.013,
    feeFromBalance: 0.003,
    expectedReturn: { conservative: 0.035, medium: 0.055, optimistic: 0.08 },
  },
];

export const scenarioLabels: Record<'conservative' | 'medium' | 'optimistic', string> = {
  conservative: 'שמרני',
  medium: 'בינוני',
  optimistic: 'אופטימי',
};
