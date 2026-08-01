import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface ExtractedStatementData {
  balance: number | null;
  depositFee: number | null;
  balanceFee: number | null;
  fundName: string | null;
}

export async function extractTextFromPdf(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const doc = await getDocument({ data: buffer }).promise;
  const pageTexts: string[] = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => ('str' in item ? item.str : '')).join(' ');
    pageTexts.push(pageText);
  }
  return pageTexts.join('\n');
}

/** מספר "ממשי" של סכום כספי — עם פסיק אלפים, או לפחות 4 ספרות שלמות (כדי לא לתפוס תאריכים כמו 31.12) */
const CURRENCY_NUMBER = /\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d{4,}(?:\.\d{1,2})?/;
const PERCENT_NUMBER = /\d{1,2}(?:\.\d{1,2})?\s*%/;

/** מחפש תווית, ואז סורק חלון תווים שאחריה למספר מהצורה המבוקשת — כך תאריך שמופיע לפני הסכום לא "נתפס" בטעות. */
function findValueNear(text: string, labelPattern: RegExp, valuePattern: RegExp, windowSize = 60): string | null {
  const labelMatch = text.match(labelPattern);
  if (!labelMatch || labelMatch.index === undefined) return null;
  const windowStart = labelMatch.index + labelMatch[0].length;
  const window = text.slice(windowStart, windowStart + windowSize);
  const valueMatch = window.match(valuePattern);
  return valueMatch ? valueMatch[0] : null;
}

function parseNumber(raw: string): number {
  return Number(raw.replace(/,/g, ''));
}

/**
 * חילוץ משוער בלבד — מבוסס על ביטויים נפוצים בתדפיסים שנתיים של קרנות פנסיה
 * בישראל. הפורמט משתנה בין חברות, לכן יש לבדוק ולתקן את התוצאה תמיד.
 */
export function parsePensionStatement(text: string): ExtractedStatementData {
  const balanceRaw = findValueNear(
    text,
    /(?:יתרה\s*(?:צבורה|כוללת)?|יתרת\s*(?:חיסכון|צבירה)|סך\s*(?:הכל\s*)?צבירה)/,
    CURRENCY_NUMBER,
  );
  const depositFeeRaw = findValueNear(text, /דמי\s*ניהול\s*מה(?:פקדה|פרשה)/, PERCENT_NUMBER, 20);
  const balanceFeeRaw = findValueNear(text, /דמי\s*ניהול\s*מ(?:צבירה|החיסכון)/, PERCENT_NUMBER, 20);

  const fundNameLabel = text.match(/מסלול\s*(?:השקעה)?[:\s]+/);
  let fundName: string | null = null;
  if (fundNameLabel && fundNameLabel.index !== undefined) {
    const start = fundNameLabel.index + fundNameLabel[0].length;
    const window = text.slice(start, start + 40);
    const stopMatch = window.match(/^([^\d]*?)(?:\d|יתרה|דמי|סך|$)/);
    const candidate = stopMatch ? stopMatch[1].trim() : null;
    fundName = candidate && candidate.length >= 2 ? candidate : null;
  }

  return {
    balance: balanceRaw ? parseNumber(balanceRaw) : null,
    depositFee: depositFeeRaw ? Number(depositFeeRaw.replace('%', '').trim()) / 100 : null,
    balanceFee: balanceFeeRaw ? Number(balanceFeeRaw.replace('%', '').trim()) / 100 : null,
    fundName,
  };
}
