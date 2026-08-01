import type { MarketBenchmark, MarketDataResult } from '../types';

const API_BASE = 'https://data.gov.il/api/3/action/datastore_search';
const RESOURCE_ID = '6d47d6b5-cb08-488b-b333-f1e717b1e1bd';

interface RawFundRow {
  FUND_NAME: string;
  FUND_CLASSIFICATION: string | null;
  REPORT_PERIOD: number;
  AVG_DEPOSIT_FEE: number | null;
  AVG_ANNUAL_MANAGEMENT_FEE: number | null;
  AVG_ANNUAL_YIELD_TRAILING_5YRS: number | null;
  STOCK_MARKET_EXPOSURE: number | null;
}

/**
 * סיווג משוער בלבד לצורך קיבוץ קרנות אמיתיות למסלולי הדוגמה שלנו —
 * מבוסס על שם הקרן וחשיפה מנייתית בפועל, ולא סיווג רשמי של רשות שוק ההון.
 */
function classifyTrack(row: RawFundRow): string {
  const name = row.FUND_NAME ?? '';
  if (name.includes('הלכת') || name.includes('שריע')) return 'halachic';

  const exposure = row.STOCK_MARKET_EXPOSURE;
  if (exposure === null || Number.isNaN(exposure)) return 'general';
  if (exposure < 2) return 'shekel';
  if (exposure < 40) return 'bonds';
  if (exposure < 70) return 'general';
  return 'stocks';
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`data.gov.il request failed: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error('data.gov.il returned an unsuccessful response');
  return json.result;
}

export async function fetchMarketBenchmarks(): Promise<MarketDataResult> {
  const latestResult = await fetchJson(
    `${API_BASE}?resource_id=${RESOURCE_ID}&limit=1&sort=REPORT_PERIOD desc`,
  );
  const latestPeriod: number | undefined = latestResult.records[0]?.REPORT_PERIOD;
  if (!latestPeriod) throw new Error('לא נמצאה תקופת דיווח אחרונה בנתוני השוק');

  const filters = encodeURIComponent(JSON.stringify({ REPORT_PERIOD: latestPeriod }));
  const periodResult = await fetchJson(
    `${API_BASE}?resource_id=${RESOURCE_ID}&filters=${filters}&limit=5000`,
  );

  const rows: RawFundRow[] = periodResult.records;
  const buckets = new Map<string, RawFundRow[]>();
  for (const row of rows) {
    const trackId = classifyTrack(row);
    const list = buckets.get(trackId) ?? [];
    list.push(row);
    buckets.set(trackId, list);
  }

  const benchmarks: MarketBenchmark[] = Array.from(buckets.entries()).map(([trackId, list]) => ({
    trackId,
    fundCount: list.length,
    avgDepositFee: average(list.map((r) => r.AVG_DEPOSIT_FEE).filter((v): v is number => v != null)) / 100,
    avgBalanceFee:
      average(list.map((r) => r.AVG_ANNUAL_MANAGEMENT_FEE).filter((v): v is number => v != null)) / 100,
    avgYield5yr:
      average(list.map((r) => r.AVG_ANNUAL_YIELD_TRAILING_5YRS).filter((v): v is number => v != null)) / 100,
    avgStockExposure:
      average(list.map((r) => r.STOCK_MARKET_EXPOSURE).filter((v): v is number => v != null)) / 100,
  }));

  return {
    reportPeriod: String(latestPeriod),
    fetchedAt: new Date().toISOString(),
    benchmarks,
  };
}

export function formatReportPeriod(period: string): string {
  if (period.length !== 6) return period;
  const year = period.slice(0, 4);
  const month = period.slice(4, 6);
  return `${month}/${year}`;
}
