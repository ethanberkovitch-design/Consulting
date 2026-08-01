export type ReturnScenario = 'conservative' | 'medium' | 'optimistic';

export interface InvestmentTrack {
  id: string;
  name: string;
  description: string;
  riskLevel: 'נמוך מאוד' | 'נמוך' | 'בינוני' | 'בינוני-גבוה' | 'גבוה';
  color: string;
  /** דמי ניהול מהפקדה, כאחוז מכל הפקדה חודשית (לדוגמה 0.01 = 1%) */
  feeFromDeposit: number;
  /** דמי ניהול מצבירה, כאחוז שנתי מהיתרה (לדוגמה 0.003 = 0.3%) */
  feeFromBalance: number;
  /** הנחות תשואה שנתית ריאלית לדוגמה, לפי תרחיש */
  expectedReturn: Record<ReturnScenario, number>;
}

export interface PlannerInputs {
  currentAge: number;
  retirementAge: number;
  currentBalance: number;
  monthlySalary: number;
  contributionRate: number; // אחוז הפקדה כולל מהשכר, לדוגמה 0.185
  selectedTrackIds: string[];
  /** דמי הניהול שהמשתמש מדווח שהוא בפועל משלם היום, לצורך השוואה לשוק */
  actualDepositFee: number | null;
  actualBalanceFee: number | null;
}

export interface ProjectionPoint {
  age: number;
  year: number;
  balance: number;
}

export interface TrackProjection {
  track: InvestmentTrack;
  scenario: ReturnScenario;
  points: ProjectionPoint[];
  finalBalance: number;
}

export interface MarketBenchmark {
  trackId: string;
  fundCount: number;
  avgDepositFee: number;
  avgBalanceFee: number;
  avgYield5yr: number;
  avgStockExposure: number;
}

export interface MarketDataResult {
  reportPeriod: string;
  fetchedAt: string;
  benchmarks: MarketBenchmark[];
}
