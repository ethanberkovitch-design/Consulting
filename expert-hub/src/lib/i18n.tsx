import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Language = 'he' | 'en';

const strings = {
  appName: { he: 'Expert Hub', en: 'Expert Hub' },
  tagline: {
    he: 'מומחים מקצועיים שמנתחים את המסמכים שלכם — הנדסה, פיננסים וניהול.',
    en: 'Professional experts that analyse your documents — engineering, finance and management.',
  },
  signIn: { he: 'התחברות', en: 'Sign in' },
  signUp: { he: 'הרשמה', en: 'Create account' },
  signOut: { he: 'התנתקות', en: 'Sign out' },
  email: { he: 'אימייל', en: 'Email' },
  password: { he: 'סיסמה', en: 'Password' },
  noAccount: { he: 'אין לכם חשבון? להרשמה', en: 'No account? Create one' },
  haveAccount: { he: 'כבר רשומים? להתחברות', en: 'Already registered? Sign in' },
  checkEmail: {
    he: 'נרשמתם. אשרו את החשבון דרך המייל שנשלח אליכם ואז התחברו.',
    en: 'Account created. Confirm it from the email we sent you, then sign in.',
  },
  somethingWrong: { he: 'משהו השתבש. נסו שוב.', en: 'Something went wrong. Please try again.' },
  pickExpert: { he: 'באיזה תחום נעבוד עכשיו?', en: 'Which field are we working in?' },
  pickExpertHint: {
    he: 'בחרו מומחה. אפשר להעלות מסמכים, לשאול שאלות ולקבל דוח מקצועי מסודר.',
    en: 'Choose an expert. Upload documents, ask questions and get a structured professional report.',
  },
  recent: { he: 'שיחות אחרונות', en: 'Recent conversations' },
  noRecent: { he: 'עדיין אין שיחות.', en: 'No conversations yet.' },
  untitled: { he: 'שיחה ללא כותרת', en: 'Untitled conversation' },
  allExperts: { he: 'כל המומחים', en: 'All experts' },
  newConversation: { he: 'שיחה חדשה', en: 'New conversation' },
  documents: { he: 'מסמכים בשיחה', en: 'Documents in this conversation' },
  noDocuments: {
    he: 'אין עדיין מסמכים. העלו קבצים כדי שהמומחה ינתח אותם.',
    en: 'No documents yet. Upload files for the expert to analyse.',
  },
  upload: { he: 'העלאת מסמכים', en: 'Upload documents' },
  uploading: { he: 'מעלה…', en: 'Uploading…' },
  acceptedFiles: {
    he: 'PDF, Word, Excel, CSV, טקסט ותמונות · עד 25MB לקובץ',
    en: 'PDF, Word, Excel, CSV, text and images · up to 25MB per file',
  },
  fileTooLarge: { he: 'הקובץ גדול מדי (מעל 25MB):', en: 'File too large (over 25MB):' },
  fileUnsupported: { he: 'סוג קובץ שאינו נתמך:', en: 'Unsupported file type:' },
  remove: { he: 'הסרה', en: 'Remove' },
  askPlaceholder: { he: 'שאלו את המומחה…', en: 'Ask the expert…' },
  send: { he: 'שליחה', en: 'Send' },
  stop: { he: 'עצירה', en: 'Stop' },
  suggested: { he: 'אפשר להתחיל מכאן', en: 'Start here' },
  statusThinking: { he: 'המומחה מנתח…', en: 'The expert is analysing…' },
  statusSearching: { he: 'מחפש מקורות עדכניים…', en: 'Searching current sources…' },
  statusCalculating: { he: 'מחשב…', en: 'Calculating…' },
  statusWriting: { he: 'כותב…', en: 'Writing…' },
  sources: { he: 'מקורות', en: 'Sources' },
  you: { he: 'אתם', en: 'You' },
  generateReport: { he: 'הפקת דוח מקצועי', en: 'Generate report' },
  generatingReport: { he: 'מפיק דוח…', en: 'Generating report…' },
  reportNeedsContent: {
    he: 'העלו מסמך או שאלו שאלה לפני הפקת דוח.',
    en: 'Upload a document or ask a question before generating a report.',
  },
  report: { he: 'דוח', en: 'Report' },
  reports: { he: 'דוחות', en: 'Reports' },
  viewReport: { he: 'צפייה בדוח', en: 'View report' },
  printPdf: { he: 'הורדה כ-PDF / הדפסה', en: 'Save as PDF / print' },
  downloadMd: { he: 'הורדה כטקסט (Markdown)', en: 'Download as Markdown' },
  close: { he: 'סגירה', en: 'Close' },
  preparedBy: { he: 'הוכן באמצעות Expert Hub', en: 'Prepared with Expert Hub' },
  reportDisclaimer: {
    he: 'הדוח מהווה ניתוח ותמיכה בהחלטות, ואינו מחליף חוות דעת או חתימה של בעל מקצוע מורשה. יש לאמת נתונים וסעיפי תקן מול המקור לפני הסתמכות.',
    en: 'This report is analysis and decision support. It does not replace the opinion or signature of a licensed professional. Verify figures and standard clauses against the source before relying on them.',
  },
  disclaimer: {
    he: 'המומחים מנתחים ומסייעים בקבלת החלטות. החלטות הדורשות חתימה של בעל מקצוע מורשה — נשארות אצלו.',
    en: 'The experts analyse and support decisions. Decisions that require a licensed professional’s signature stay with them.',
  },
  language: { he: 'English', en: 'עברית' },
  loading: { he: 'טוען…', en: 'Loading…' },
  categoryAll: { he: 'הכל', en: 'All' },
  categoryEngineering: { he: 'הנדסה ובנייה', en: 'Engineering & construction' },
  categoryFinance: { he: 'פיננסים ורכש', en: 'Finance & procurement' },
  categoryManagement: { he: 'ניהול ואנשים', en: 'Management & people' },
  categoryInnovation: { he: 'חדשנות וקיימות', en: 'Innovation & sustainability' },
  backHome: { he: 'חזרה למסך הראשי', en: 'Back to home' },
  deleteConversation: { he: 'מחיקת שיחה', en: 'Delete conversation' },
  confirmDelete: {
    he: 'למחוק את השיחה, ההודעות והמסמכים שלה? אי אפשר לשחזר.',
    en: 'Delete this conversation with its messages and documents? This cannot be undone.',
  },
  library: { he: 'ספריית מומחים', en: 'Expert library' },
  libraryIntro: {
    he: 'מסמכי ייחוס שכל מומחה מקבל עם כל שאלה: נהלים פנימיים, מפרטים, קטעים ממוקדים מתקנים. מה שכאן נשלח למודל בכל שאלה למומחה, ולכן משפיע על העלות.',
    en: 'Reference documents each expert receives with every question: internal procedures, specifications, focused excerpts of standards. Everything here goes to the model with each question to that expert, so it drives cost.',
  },
  libraryCopyright: {
    he: 'תקנים של מכון התקנים ומסמכים מסחריים מוגנים בזכויות יוצרים. העלו רק חומר שיש לכם רישיון להשתמש בו בשירות.',
    en: 'SII standards and commercial documents are copyrighted. Upload only material you are licensed to use in the service.',
  },
  libraryUpload: { he: 'הוספת מסמך', en: 'Add a document' },
  libraryExpert: { he: 'מומחה', en: 'Expert' },
  libraryTitle: { he: 'כותרת (המומחה רואה אותה)', en: 'Title (the expert sees it)' },
  libraryTitleHint: { he: 'למשל: נוהל יציקה פנימי, מהדורה 3', en: 'e.g. Internal pouring procedure, rev. 3' },
  libraryFile: { he: 'קובץ', en: 'File' },
  libraryAdd: { he: 'העלאה', en: 'Upload' },
  libraryCounting: { he: 'סופר טוקנים…', en: 'Counting tokens…' },
  libraryEmpty: { he: 'אין מסמכים בספרייה של מומחה זה.', en: 'No documents in this expert’s library.' },
  libraryActive: { he: 'פעיל', en: 'Active' },
  libraryInactive: { he: 'כבוי', en: 'Off' },
  libraryRecount: { he: 'ספירה מחדש', en: 'Recount' },
  libraryDelete: { he: 'מחיקה', en: 'Delete' },
  libraryConfirmDelete: {
    he: 'למחוק את המסמך מהספרייה? אי אפשר לשחזר.',
    en: 'Delete this document from the library? This cannot be undone.',
  },
  libraryTokens: { he: 'טוקנים', en: 'tokens' },
  libraryPerQuestion: { he: 'תוספת לכל שאלה', en: 'Added to each question' },
  libraryFirstQuestion: { he: 'שאלה ראשונה', en: 'first question' },
  libraryCachedQuestion: { he: 'שאלות נוספות תוך 5 דקות', en: 'further questions within 5 minutes' },
  libraryOverBudget: {
    he: 'חורג מתקרת הספרייה למומחה (15MB פעילים). כבו או מחקו מסמך אחר קודם.',
    en: 'Exceeds the expert’s library cap (15MB active). Turn off or delete another document first.',
  },
  libraryWarnTokens: {
    he: 'ספרייה גדולה: כל שאלה למומחה הזה מתייקרת משמעותית. עדיף קטעים ממוקדים על פני מסמכים שלמים.',
    en: 'Large library: every question to this expert costs noticeably more. Prefer focused excerpts over whole documents.',
  },
  libraryNotCounted: { he: 'לא נספר', en: 'not counted' },
  libraryCountFailed: {
    he: 'המודל לא הצליח לקרוא את הקובץ, והוא נשאר כבוי:',
    en: 'The model could not read the file, so it stays off:',
  },
  libraryAdminsOnly: { he: 'המסך הזה פתוח למנהלים בלבד.', en: 'This screen is for admins only.' },
} as const;

export type StringKey = keyof typeof strings;

interface I18nValue {
  lang: Language;
  dir: 'rtl' | 'ltr';
  setLang: (lang: Language) => void;
  t: (key: StringKey) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function readStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem('expert-hub:lang');
    if (stored === 'he' || stored === 'en') return stored;
  } catch {
    // storage unavailable — fall through to default
  }
  return 'he';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(readStoredLanguage);
  const dir = lang === 'he' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      dir,
      setLang: (next) => {
        setLangState(next);
        try {
          localStorage.setItem('expert-hub:lang', next);
        } catch {
          // ignore
        }
      },
      t: (key) => strings[key][lang],
    }),
    [lang, dir],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// eslint-disable-next-line react/only-export-components
export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
