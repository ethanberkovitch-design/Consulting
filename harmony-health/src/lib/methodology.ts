// The Harmony Method — a synthesis of the most evidence-based weight-loss
// approaches, distilled into 5 pillars. Each pillar carries actionable rules
// and a "why" grounded in existing methods (referenced in the Method screen).

export interface Pillar {
  key: 'nutrition' | 'movement' | 'sleep' | 'mind' | 'measure'
  order: number
  title: string
  tagline: string
  icon: string
  color: string
  intro: string
  principles: string[]
  dailyChecks: string[]
  weeklyChecks: string[]
  drawsFrom: string[]
}

export const PILLARS: Pillar[] = [
  {
    key: 'nutrition',
    order: 1,
    title: 'תזונה חכמה',
    tagline: 'גירעון מתון, חלבון גבוה, מזון אמיתי',
    icon: 'utensils',
    color: 'var(--sage)',
    intro:
      'האנרגיה שאת/ה מכניס/ה מול זו שאתה שורף/ת קובעת את המשקל, אבל הבחירות היומיומיות הן שיקבעו אם התהליך יהיה נעים ובר-קיימא. השילוב שבנינו: גירעון של 15–25%, חלבון של 1.6–2.2 גר\' לק"ג משקל גוף, שומנים בריאים, וסיבים מהצומח.',
    principles: [
      'עדיפות למזון בעל צפיפות תזונתית גבוהה — ירקות, קטניות, דגנים מלאים, חלבונים רזים.',
      'כלל 80/20 — 80% מזון מלא, 20% גמישות לחיים אמיתיים (חתונה, יומולדת, שוקולד).',
      'אכילה איטית — מניחים סכו"ם בין ביסים, לועסים 20–30 פעם.',
      'הידרציה לפני רעב — לרוב מדובר בצמא במסווה.',
      'לא לצנוח מתחת לרצפה הקלורית האישית שלך (הוגדרה אוטומטית מתחת ל-BMR).',
    ],
    dailyChecks: [
      'עמדת ביעד קלוריות ±100?',
      'עמדת ביעד החלבון?',
      'לפחות 5 מנות ירקות/פירות?',
      '2–3 ליטר מים?',
    ],
    weeklyChecks: [
      'אמצע השבוע — האם התפריט עדיין מספק?',
      'האם היו התקפי אכילה? מה גרם להם?',
    ],
    drawsFrom: [
      'Mifflin-St Jeor (BMR)',
      'תזונה ים-תיכונית (PREDIMED)',
      'Volumetrics (Barbara Rolls)',
      'High-Protein Preservation (Helms, Aragon, Fitschen)',
    ],
  },
  {
    key: 'movement',
    order: 2,
    title: 'תנועה מותאמת',
    tagline: 'לא רק אימונים — גם צעדים ביום-יום',
    icon: 'activity',
    color: 'var(--accent-cool)',
    intro:
      'אימון כוח משמר מסת שריר וקצב מטבולי; קרדיו משפר בריאות לב-ריאה; אבל ה-NEAT — כל התנועה מחוץ לאימון — הוא לעיתים 15–30% מסך ההוצאה היומית. השיטה משלבת: 2–3 אימוני כוח בשבוע, 150 דקות קרדיו מתון, ויעד צעדים יומי.',
    principles: [
      'אימוני כוח 2–3 פעמים בשבוע — עדיפות לתרגילים מרובי-מפרקים (סקוואט, דדליפט, לחיצות, משיכות).',
      'העמסה פרוגרסיבית — מוסיפים משקל/חזרות בהדרגה.',
      'יעד צעדים יומי — לפי רמת פעילות (6,000–12,000).',
      'שילוב קרדיו: לפחות 150 דקות בשבוע בעצימות מתונה, או 75 בעצימות גבוהה.',
      'תנועת גמישות ויציבות פעם בשבוע.',
    ],
    dailyChecks: [
      'האם עמדת ביעד הצעדים?',
      'קמת מהכיסא כל שעה?',
    ],
    weeklyChecks: [
      'הושלמו 2–3 אימוני כוח?',
      'הושלמו לפחות 150 דקות קרדיו מצטבר?',
    ],
    drawsFrom: [
      'ACSM Guidelines',
      'NEAT (James Levine, Mayo Clinic)',
      'Strength for Fat Loss (Schoenfeld)',
    ],
  },
  {
    key: 'sleep',
    order: 3,
    title: 'שינה איכותית',
    tagline: 'הדלק הסודי של ירידה במשקל',
    icon: 'moon',
    color: 'var(--navy)',
    intro:
      'שינה של פחות מ-7 שעות מגבירה גרלין (הורמון הרעב), מדכאת לפטין (השובע), מעלה קורטיזול ומורידה רגישות לאינסולין. במחקרים — אנשים בגירעון קלורי שישנו 5.5 שעות איבדו כמות שווה של משקל, אך 55% מזה היה שריר לעומת 22% אצל אלה שישנו 8.5 שעות.',
    principles: [
      'שאיפה ל-7–9 שעות שינה בלילה.',
      'שגרת שינה עקבית — אותה שעת שכיבה ויקיצה ±30 דקות.',
      'אין מסכים 60 דקות לפני השינה.',
      'החדר קריר (18–20°C), חשוך, ושקט.',
      'קפאין רק עד 8 שעות לפני השינה.',
    ],
    dailyChecks: [
      'ישנת 7+ שעות?',
      'הלכת לישון באותה שעה?',
    ],
    weeklyChecks: [
      'עמדת ב-7+ שעות רוב הלילות?',
      'איך ההרגשה בבוקר?',
    ],
    drawsFrom: [
      'Nedeltcheva et al. (2010) — Sleep & Fat Loss',
      'Walker — Why We Sleep',
    ],
  },
  {
    key: 'mind',
    order: 4,
    title: 'מיינדפולנס וניהול לחץ',
    tagline: 'הראש הוא 80% מהתהליך',
    icon: 'brain',
    color: 'var(--gold)',
    intro:
      'ירידה במשקל שנכשלת — כמעט תמיד לא נכשלת בגלל אכילת עודף קלוריות, אלא בגלל הסיבה מאחורי האכילה. השיטה משלבת כלים מטיפול קוגניטיבי-התנהגותי (CBT), מיינדפולנס, ומדע ההרגלים (Atomic Habits) לזיהוי ושבירת דפוסי אכילה רגשית.',
    principles: [
      'זיהוי טריגרים — מיפוי רגעי אכילה לא-רעבה (שעמום, לחץ, עייפות, בדידות).',
      'החלפת הרגלים — אותה סביבה, אותו טריגר, תגובה חדשה.',
      'מיינדפולנס יומי — 5–10 דקות מדיטציה או נשימה מודעת.',
      'יומן רגשות — 3 שורות בערב על מה שהניע היום.',
      'אכילה מודעת בארוחה — בלי מסכים, מרגישים טעם ומרקם.',
    ],
    dailyChecks: [
      'תרגלת מיינדפולנס 5 דקות?',
      'רשמת ביומן הרגשות?',
    ],
    weeklyChecks: [
      'איך ניהלת רגעי לחץ השבוע?',
      'זיהית טריגרים חדשים?',
    ],
    drawsFrom: [
      'CBT for Eating (Fairburn)',
      'Atomic Habits (James Clear)',
      'Mindful Eating (Jan Chozen Bays)',
    ],
  },
  {
    key: 'measure',
    order: 5,
    title: 'מדידה והתאמה',
    tagline: 'לא מנחשים — מודדים ומכוונים',
    icon: 'trending-up',
    color: 'var(--gold-deep)',
    intro:
      'הגוף אינו סטטי. אחרי 2–4 שבועות, ה-TDEE יורד קצת (התאמה מטבולית), רמת הפעילות משתנה, והצרכים משתנים. השיטה כוללת מדידה שבועית של המשקל (ממוצע נע), היקפים, כושר וכוח — והתאמה אוטומטית של היעדים.',
    principles: [
      'שקילה יומית באותה שעה — משתמשים בממוצע שבועי, לא במספר יומי.',
      'מדידת היקפים אחת לשבועיים — מותן, ירך, אמצע זרוע.',
      'תמונות התקדמות אחת לחודש.',
      'התאמת קלוריות אם ההתקדמות עומדת 3 שבועות ברציפות.',
      'חגיגת אבני-דרך — לא רק במשקל, גם בהרגלים.',
    ],
    dailyChecks: [
      'נשקלת ורשמת?',
    ],
    weeklyChecks: [
      'מה הממוצע השבועי?',
      'האם צריך התאמת קלוריות?',
      'מה עבד השבוע? מה לא?',
    ],
    drawsFrom: [
      'The Hacker\'s Diet (Walker)',
      'Reverse Dieting (Trexler et al.)',
      'Behavioral Weight Loss (Wing & Phelan)',
    ],
  },
]

export interface DailyPillarProgress {
  nutrition: number
  movement: number
  sleep: number
  mind: number
  measure: number
}

export function computeHarmonyScore(progress: DailyPillarProgress): number {
  const values = Object.values(progress)
  const sum = values.reduce((a, b) => a + b, 0)
  return Math.round(sum / values.length)
}

export const METHOD_INTRO = {
  title: 'שיטת 5 העמודים',
  subtitle: 'סינתזה מדעית — נבנתה מהמחקר הטוב ביותר בירידה במשקל',
  paragraphs: [
    'אחוזי ההצלחה של דיאטות מסחריות בטווח הארוך נעים בין 5–20%. הרוב חוזרים למשקל המקורי או עוברים אותו תוך 2–5 שנים. הסיבה כמעט אף פעם לא חוסר "כוח רצון" — אלא חוסר איזון בין העמודים.',
    'בנינו את השיטה סביב עיקרון פשוט: ירידה במשקל שנשארת היא תוצאה של 5 מערכות שעובדות בהרמוניה. אם משנים רק אחת (למשל, רק סופרים קלוריות) — הגוף מפצה. אם משנים את כולן בהדרגה — התוצאה הופכת ל-default החדש.',
    'כל עמוד נשען על מחקר מוכח. השילוב ביניהם — זה החידוש.',
  ],
}
