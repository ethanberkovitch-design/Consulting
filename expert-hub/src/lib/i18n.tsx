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
  categoryEngineering: { he: 'הנדסה', en: 'Engineering' },
  categoryFinance: { he: 'פיננסים', en: 'Finance' },
  categoryManagement: { he: 'ניהול', en: 'Management' },
  deleteConversation: { he: 'מחיקת שיחה', en: 'Delete conversation' },
  confirmDelete: {
    he: 'למחוק את השיחה, ההודעות והמסמכים שלה? אי אפשר לשחזר.',
    en: 'Delete this conversation with its messages and documents? This cannot be undone.',
  },
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
