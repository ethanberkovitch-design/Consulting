import { Briefcase, Building2, Construction, LineChart, Layers, Mountain, Truck, type LucideIcon } from 'lucide-react';
import type { Language } from '../lib/i18n';

/**
 * Public expert cards. The prompts live server-side only
 * (supabase/functions/_shared/experts.ts); ids must match.
 */
export type ExpertId = 'management' | 'finance' | 'concrete' | 'steel' | 'structural' | 'supply' | 'geology';
export type Category = 'engineering' | 'finance' | 'management';

type Localized = Record<Language, string>;

export interface ExpertCard {
  id: ExpertId;
  category: Category;
  icon: LucideIcon;
  name: Localized;
  summary: Localized;
  typicalDocuments: Localized;
  starters: Record<Language, string[]>;
}

export const EXPERTS: ExpertCard[] = [
  {
    id: 'concrete',
    category: 'engineering',
    icon: Layers,
    name: { he: 'מומחה בטון', en: 'Concrete expert' },
    summary: {
      he: 'תכנוני תערובות, תוצאות בדיקות חוזק, התאמה לתקן, סדקים וליקויי ביצוע.',
      en: 'Mix designs, strength results, conformity with standards, cracking and execution defects.',
    },
    typicalDocuments: {
      he: 'תכנון תערובת, דוחות מעבדה, תעודות משלוח, מפרט טכני',
      en: 'Mix design, lab reports, delivery tickets, technical specification',
    },
    starters: {
      he: [
        'בדוק האם תכנון התערובת המצורף עומד בדרישות המפרט ובדרגת החשיפה',
        'תוצאות החוזק ל-28 יום נמוכות מהנדרש. מה הסיבות האפשריות ומה הצעדים הבאים?',
        'אנחנו יוצקים רפסודה עבה בקיץ. מה צריך לתכנן כדי למנוע סדקים תרמיים?',
      ],
      en: [
        'Check whether the attached mix design meets the specification and exposure class',
        'Our 28-day strengths came in low. What are the likely causes and next steps?',
        'We are pouring a thick raft in summer. What should we plan to prevent thermal cracking?',
      ],
    },
  },
  {
    id: 'steel',
    category: 'engineering',
    icon: Construction,
    name: { he: 'מומחה פלדה', en: 'Structural steel expert' },
    summary: {
      he: 'בדיקת אלמנטים וחיבורים, תעודות חומר, ריתוך וברגים, הקמה והגנה מקורוזיה ואש.',
      en: 'Member and connection checks, mill certificates, welding and bolting, erection, corrosion and fire protection.',
    },
    typicalDocuments: {
      he: 'תכניות ייצור, חישובים, תעודות יצרן, דוחות בדיקות NDT',
      en: 'Shop drawings, calculations, mill certificates, NDT reports',
    },
    starters: {
      he: [
        'עבור על תעודות היצרן המצורפות ובדוק התאמה לדרישות המפרט',
        'בדוק את חיבור הקורה-עמוד בתכנית המצורפת והצג את החישוב',
        'אילו בדיקות ריתוך ובאיזה היקף נדרשות למבנה כזה?',
      ],
      en: [
        'Review the attached mill certificates against the specification',
        'Check the beam-to-column connection in the attached drawing and show the calculation',
        'What weld inspection, and how much of it, does a structure like this need?',
      ],
    },
  },
  {
    id: 'structural',
    category: 'engineering',
    icon: Building2,
    name: { he: 'מומחה תכנון מבנים', en: 'Structural design expert' },
    summary: {
      he: 'מערכת נושאת ומסלול עומסים, בסיס תכנון, רעידות אדמה, בדיקות סבירות ושינויים באתר.',
      en: 'Structural system and load path, design basis, seismic, plausibility checks and site changes.',
    },
    typicalDocuments: {
      he: 'תכניות קונסטרוקציה ואדריכלות, דוח קרקע, חישובים סטטיים',
      en: 'Structural and architectural drawings, geotechnical report, calculations',
    },
    starters: {
      he: [
        'עבור על בסיס התכנון המצורף וסמן חוסרים או הנחות בעייתיות',
        'הקבלן מבקש לפתוח פתח בתקרה. מה ההשלכות הקונסטרוקטיביות ומה צריך לבדוק?',
        'בדוק סבירות של עובי התקרות ומידות העמודים בתכניות המצורפות',
      ],
      en: [
        'Review the attached design basis and flag gaps or questionable assumptions',
        'The contractor wants a new slab opening. What are the structural implications and what must be checked?',
        'Sanity-check slab thicknesses and column sizes in the attached drawings',
      ],
    },
  },
  {
    id: 'geology',
    category: 'engineering',
    icon: Mountain,
    name: { he: 'מומחה גיאולוגיה', en: 'Geology expert' },
    summary: {
      he: 'דוחות קרקע ומי תהום, סיכוני קרקע ויסודות, חפירות ומדרונות, מחצבות ואיכות אגרגטים.',
      en: 'Site investigation and groundwater, ground hazards and foundations, excavations and slopes, quarries and aggregate quality.',
    },
    typicalDocuments: {
      he: 'דוח קרקע, יומני קידוח, בדיקות מעבדה, תוכנית חפירה, בדיקות אגרגט',
      en: 'Geotechnical report, borehole logs, lab tests, excavation plan, aggregate tests',
    },
    starters: {
      he: [
        'האם חקירת הקרקע המצורפת מספיקה לתכנון הביסוס של המבנה?',
        'מה הסיכונים בתוכנית החפירה המצורפת, כולל מי תהום ומבנים שכנים?',
        'האם האגרגט מהמחצבה מתאים לבטון לפי תוצאות הבדיקות המצורפות?',
      ],
      en: [
        'Is the attached site investigation enough to design the foundations?',
        'What are the risks in the attached excavation plan, including groundwater and neighbouring buildings?',
        'Is the quarry aggregate suitable for concrete according to the attached test results?',
      ],
    },
  },
  {
    id: 'finance',
    category: 'finance',
    icon: LineChart,
    name: { he: 'מומחה פיננסי', en: 'Financial expert' },
    summary: {
      he: 'ניתוח דוחות כספיים, תזרים, יחסים פיננסיים, בדיקת מודלים ותחזיות, והערכות שווי.',
      en: 'Financial statements, cash flow, ratios, model and forecast review, and valuation.',
    },
    typicalDocuments: {
      he: 'דוחות כספיים, מאזן בוחן, מודל אקסל, תקציב, הסכמי הלוואה',
      en: 'Financial statements, trial balance, Excel model, budget, loan agreements',
    },
    starters: {
      he: [
        'נתח את הדוחות הכספיים המצורפים: רווחיות, הון חוזר ותזרים',
        'בדוק את הנחות המודל הפיננסי ומצא את ההנחה שהתוצאה הכי רגישה אליה',
        'מה מצב העמידה באמות המידה הפיננסיות בהסכם ההלוואה?',
      ],
      en: [
        'Analyse the attached financial statements: profitability, working capital and cash flow',
        'Review the model’s assumptions and find the one the result is most sensitive to',
        'How much headroom is there on the loan agreement covenants?',
      ],
    },
  },
  {
    id: 'management',
    category: 'management',
    icon: Briefcase,
    name: { he: 'מומחה ניהולי', en: 'Management expert' },
    summary: {
      he: 'אסטרטגיה, תפעול, מבנה ארגוני, תכניות עבודה ויעדים — מאבחון ועד תכנית ביצוע.',
      en: 'Strategy, operations, organisation, work plans and targets — from diagnosis to execution plan.',
    },
    typicalDocuments: {
      he: 'תכנית עסקית, מצגת הנהלה, מבנה ארגוני, דוחות KPI, תקציב',
      en: 'Business plan, management deck, org chart, KPI reports, budget',
    },
    starters: {
      he: [
        'האם היעדים, כוח האדם והתקציב בתכנית העבודה המצורפת מתיישבים זה עם זה?',
        'מה צוואר הבקבוק המרכזי בתפעול לפי הנתונים המצורפים?',
        'בנה תכנית ביצוע לרבעון הקרוב: אחראים, אבני דרך ומדדים',
      ],
      en: [
        'Do the targets, headcount and budget in the attached plan fit together?',
        'What is the main operational bottleneck according to the attached data?',
        'Build an execution plan for next quarter: owners, milestones and KPIs',
      ],
    },
  },
  {
    id: 'supply',
    category: 'management',
    icon: Truck,
    name: { he: 'מומחה רכש ושרשרת אספקה', en: 'Procurement & supply chain expert' },
    summary: {
      he: 'השוואת הצעות לפי עלות כוללת, חוזים והצמדות, ספקים וסיכונים, מלאי ולוגיסטיקה.',
      en: 'Quotes compared on total cost, contracts and indexation, suppliers and risk, inventory and logistics.',
    },
    typicalDocuments: {
      he: 'הצעות מחיר, חוזי ספקים, נתוני רכש, דוחות מלאי ואספקה',
      en: 'Supplier quotes, supply contracts, purchasing data, inventory and delivery reports',
    },
    starters: {
      he: [
        'השווה בין הצעות המחיר המצורפות לפי עלות כוללת ולא רק לפי מחיר ליחידה',
        'בדוק שהחשבונית של הספק תואמת את סעיף ההצמדה בחוזה',
        'איפה הסיכון הגדול ביותר בשרשרת האספקה שלנו לפי הנתונים המצורפים?',
      ],
      en: [
        'Compare the attached quotes on total cost, not just unit price',
        'Check that the supplier’s invoice matches the indexation clause in the contract',
        'Where is the biggest risk in our supply chain according to the attached data?',
      ],
    },
  },
];

export const CATEGORY_ORDER: Category[] = ['engineering', 'finance', 'management'];

export const CATEGORY_COLOR: Record<Category, string> = {
  engineering: 'var(--cat-engineering)',
  finance: 'var(--cat-finance)',
  management: 'var(--cat-management)',
};

export function getExpert(id: string): ExpertCard | undefined {
  return EXPERTS.find((e) => e.id === id);
}
