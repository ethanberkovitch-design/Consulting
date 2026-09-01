// Curated tips, insights and gentle wisdom — the "quiet coach" of the app.
// Each tip carries a category, an angle (fact / practice / mindset / myth-buster
// / gentle reminder), and an optional deeper explainer.

export type TipCategory = 'nutrition' | 'movement' | 'sleep' | 'mind' | 'measure' | 'lifestyle'
export type TipAngle = 'fact' | 'practice' | 'mindset' | 'myth' | 'reminder' | 'quote'

export interface Tip {
  id: string
  category: TipCategory
  angle: TipAngle
  title: string
  body: string
  deeper?: string
  source?: string
}

export const TIPS: Tip[] = [
  // Nutrition
  {
    id: 'protein-satiety',
    category: 'nutrition',
    angle: 'fact',
    title: 'החלבון הוא שומר הראש של הדיאטה',
    body: 'ארוחה עם 30+ גרם חלבון מפחיתה תאבון ב-4–6 שעות הבאות בממוצע של 25%.',
    deeper: 'החלבון מפעיל שחרור של PYY ו-GLP-1 — הורמוני שובע. עלייה מ-15% ל-30% של קלוריות מחלבון הראתה במחקר של Weigle et al. (2005) ירידה ספונטנית של 441 קק"ל ליום.',
    source: 'Weigle et al. (2005), AJCN',
  },
  {
    id: 'water-hunger',
    category: 'nutrition',
    angle: 'practice',
    title: 'לפני שאתה רעב — כוס מים',
    body: 'צמא ורעב עוברים דרך אותו איזור מוחי (ההיפותלמוס). ב-37% מהזמנים שאתה מרגיש רעב — פשוט צמא.',
    deeper: 'נסה: כוס מים 15 דקות לפני שאתה נותן לעצמך להחליט אם באמת רעב. אם עוד רעב אחרי — אכול. אם לא — סימן.',
  },
  {
    id: 'chew-count',
    category: 'nutrition',
    angle: 'practice',
    title: 'לועסים 20 פעם — לפחות',
    body: 'המוח מקבל סיגנל שובע 15–20 דקות אחרי הביס הראשון. אכילה מהירה = חוצה את קו השובע לפני שהמוח הגיע.',
    deeper: 'נסה: הנח סכו"ם בין ביסים. לעס עד שהמזון נוזלי. תופתע כמה פחות תרצה להוסיף.',
  },
  {
    id: 'plate-method',
    category: 'nutrition',
    angle: 'practice',
    title: 'שיטת הצלחת: 50/25/25',
    body: 'חצי צלחת ירקות. רבע חלבון. רבע פחמימה. גם בלי לספור קלוריות — זה עובד.',
  },
  {
    id: 'sugar-not-evil',
    category: 'nutrition',
    angle: 'myth',
    title: 'סוכר לא הופך אותך לשמן — עודף קלוריות כן',
    body: 'הפילה שאתה חייב לחתוך את כל הסוכרים היא מיתוס. עודף קלורי הוא הגורם. סוכר בכמות בשלטון — לא בעיה.',
    deeper: 'למחקר: קבוצה שאכלה 43% מקלוריותיה מסוכר עם גירעון קלורי איבדה 2.8 ק"ג בחודשיים. הבעיה של סוכר היא בעיקר שהוא צפוף קלורית ולא משביע.',
    source: 'Kanter et al. (2018)',
  },
  {
    id: 'weekend-effect',
    category: 'nutrition',
    angle: 'fact',
    title: 'הסודוקו של סוף השבוע',
    body: 'רוב האנשים מדייקים במשך השבוע ואוכלים עודף של 500–1500 קק"ל בסופש. זה מבטל את הגירעון.',
    deeper: 'תרגיל: לפני שהסופש מתחיל, החליט מראש על שני "פינוקים מתוכננים". פינוק מתוכנן אינו מוריד מהתהליך — אכילה בלתי מבוקרת של כלום נכון מכן.',
  },
  {
    id: 'fiber-key',
    category: 'nutrition',
    angle: 'fact',
    title: 'סיבים = שובע ארוך + מיקרוביום בריא',
    body: 'יעד: 25–35 גרם ליום. מקורות מובילים: קטניות, שיבולת שועל, פירות עם קליפה, ירקות ממשפחת המצליבים.',
  },
  {
    id: 'restaurant-hack',
    category: 'nutrition',
    angle: 'practice',
    title: 'במסעדה: החלבון קודם',
    body: 'התחל את הארוחה מהחלבון והירקות. תגיע לפחמימות עם פחות רעב וטבעית תאכל פחות.',
  },

  // Movement
  {
    id: 'neat-secret',
    category: 'movement',
    angle: 'fact',
    title: 'NEAT — 15% מההוצאה היומית',
    body: 'כל התנועה שאינה אימון — הליכה, עמידה, אפילו קימה מכיסא — מייצרת עד 500 קק"ל ביום.',
    deeper: 'מחקר של Levine (2005) הראה שאנשים "לא-משמינים" זזים בפועל 2.5 שעות יותר ליום מ"משמינים" — אפילו כשהם יושבים במשרד.',
    source: 'Levine et al. (2005), Science',
  },
  {
    id: 'strength-women',
    category: 'movement',
    angle: 'myth',
    title: 'לא, אימוני כוח לא יעשו אותך "מסיבית"',
    body: 'לנשים אין את הטסטוסטרון להיות "בולט". אימוני כוח בונים גוף חטוב, מחזקים עצמות ומעלים מטבוליזם.',
  },
  {
    id: 'consistency-vs-perfection',
    category: 'movement',
    angle: 'mindset',
    title: '3 ימים ×50% > 6 ימים ×0%',
    body: 'עדיף אימון קצר וקבוע מאשר תוכנית שאפתנית שנשברת אחרי שבועיים.',
  },
  {
    id: 'walk-post-meal',
    category: 'movement',
    angle: 'practice',
    title: '10 דקות הליכה אחרי אוכל',
    body: 'הליכה קלה אחרי ארוחה מפחיתה את שיא הסוכר בדם ב-30% ומאיצה עיכול.',
    source: 'Reynolds et al. (2016)',
  },

  // Sleep
  {
    id: 'sleep-loss-muscle',
    category: 'sleep',
    angle: 'fact',
    title: 'שינה של 5 שעות = איבוד כמעט 3× יותר שריר',
    body: 'שתי קבוצות בגירעון קלורי איבדו אותה כמות משקל. הישנים 5.5 שעות איבדו 55% שריר; הישנים 8.5 שעות — 22% בלבד.',
    source: 'Nedeltcheva et al. (2010), Annals of Internal Medicine',
  },
  {
    id: 'phone-bedroom',
    category: 'sleep',
    angle: 'practice',
    title: 'הטלפון לא ישן איתך',
    body: 'הטלפון מחוץ לחדר השינה. מעורר: 6% הפרעה לאיכות שינה, פי 3 יותר יקיצות ליליות.',
  },
  {
    id: 'cool-room',
    category: 'sleep',
    angle: 'practice',
    title: 'החדר קריר (18–20°C)',
    body: 'הגוף צריך להוריד טמפ׳ פנימית ב-1°C כדי להיכנס לשינה עמוקה. חדר חם — פחות שינה עמוקה.',
  },

  // Mind
  {
    id: 'emotional-hunger',
    category: 'mind',
    angle: 'fact',
    title: 'רעב פיזי לעומת רגשי',
    body: 'רעב פיזי מתעורר בהדרגה, בטן, מוכן לאכול "כל דבר". רעב רגשי — פתאומי, ראש, רוצה משהו ספציפי.',
    deeper: 'הבחנה זו לבד יכולה להפחית אכילה רגשית ב-40%.',
  },
  {
    id: 'gratitude-diet',
    category: 'mind',
    angle: 'practice',
    title: '3 דקות של הכרת תודה = כלי לירידה במשקל',
    body: 'כתיבת 3 דברים טובים בסוף היום מורידה קורטיזול, משפרת שינה ומצמצמת אכילה רגשית.',
  },
  {
    id: 'atomic-habits',
    category: 'mind',
    angle: 'quote',
    title: '"אתה לא עולה לרמת המטרות שלך — אתה נופל לרמת המערכות שלך"',
    body: 'ג׳יימס קליר. בנה מערכת שהופכת את הבחירה הבריאה לברירת המחדל — לא רק להגיד "אני אנסה".',
  },
  {
    id: 'stress-cortisol',
    category: 'mind',
    angle: 'fact',
    title: 'לחץ כרוני = כרס שומן',
    body: 'קורטיזול גבוה מוביל לצבירת שומן ויסצרלי (בטן). ניהול לחץ = חלק מהדיאטה שלך.',
  },

  // Measure
  {
    id: 'weekly-average',
    category: 'measure',
    angle: 'practice',
    title: 'עוקבים אחרי הממוצע, לא המספר היומי',
    body: 'המשקל משתנה ±1.5 ק"ג ביום בגלל מים, מלח ומעי. הממוצע השבועי הוא סיפור האמת.',
  },
  {
    id: 'plateau-normal',
    category: 'measure',
    angle: 'reminder',
    title: 'פלטו של 2–3 שבועות — נורמלי',
    body: 'הגוף לא יורד בקו ישר. מים נצברים, המטבוליזם מתאים. אם 3 שבועות בלי שינוי — אז מתאימים 100 קק"ל למטה.',
  },
  {
    id: 'photos-truth',
    category: 'measure',
    angle: 'practice',
    title: 'תמונות אחת לחודש',
    body: 'המראה משנה. המשקל לא תמיד תופס את זה. תמונה חודשית באותה תאורה, אותם בגדים — היא הראיה הטובה ביותר.',
  },

  // Lifestyle
  {
    id: 'social-support',
    category: 'lifestyle',
    angle: 'fact',
    title: 'תשתף מישהו אחד',
    body: 'מי שמשתף מטרה עם אדם אחד קרוב — יש לו סיכוי גבוה יותר לעמוד בה.',
    source: 'Norcross & Vangarelli (1988)',
  },
  {
    id: 'kitchen-environment',
    category: 'lifestyle',
    angle: 'practice',
    title: 'הסביבה מנצחת את הרצון',
    body: 'הכי חזק שאתה יכול לעשות: מוציא את הפיתויים מהבית. מה שלא שם — לא צריך "כוח רצון".',
    deeper: 'מחקר של Wansink הראה שאנשים שיש להם קופסת שוקולד על השולחן אוכלים ממנה פי 3.',
  },
  {
    id: 'compare-yourself',
    category: 'lifestyle',
    angle: 'mindset',
    title: 'תשווה את עצמך רק לעצמך של אתמול',
    body: 'האינסטגרם משקר. יש 100,000 גורמים שלא רואים בתמונה של המשפיענית. תתמקד בקו של עצמך.',
  },
  {
    id: 'meal-prep',
    category: 'lifestyle',
    angle: 'practice',
    title: 'הכנה מראש = פחות החלטות',
    body: '2 שעות של הכנה ביום א׳ = 15 החלטות פחות במשך השבוע. פחות החלטות = פחות התמוטטויות רגשיות.',
  },
  {
    id: 'sustainable-pace',
    category: 'lifestyle',
    angle: 'mindset',
    title: 'אם אתה לא יכול לעשות את זה עוד שנה — זו לא דרך',
    body: 'שאלה של אלן אראגון: "האם אני יכול להישאר בזה עוד שנה?" אם לא — התוכנית לא בת-קיימא, לא משנה כמה יעילה.',
  },
  {
    id: 'small-wins',
    category: 'lifestyle',
    angle: 'reminder',
    title: 'ניצחונות קטנים > מהפכות גדולות',
    body: 'ניצחון של 1% ביום = כמעט 38× יותר ברמה השנתית. ניצחון של 100% חד-פעמי? חוזר לאפס בשבועיים.',
  },
]

// A stable-yet-varied "tip of the day" — deterministic per date so it doesn't
// jump around between renders, and rotates through categories.
export function tipOfTheDay(date = new Date()): Tip {
  const dayIndex = Math.floor(date.getTime() / 86400000)
  return TIPS[dayIndex % TIPS.length]
}

export function tipsByCategory(category: TipCategory): Tip[] {
  return TIPS.filter(t => t.category === category)
}

export const CATEGORY_LABEL: Record<TipCategory, string> = {
  nutrition: 'תזונה',
  movement: 'תנועה',
  sleep: 'שינה',
  mind: 'ראש',
  measure: 'מדידה',
  lifestyle: 'אורח חיים',
}

export const ANGLE_LABEL: Record<TipAngle, string> = {
  fact: 'עובדה',
  practice: 'תרגול',
  mindset: 'הלך רוח',
  myth: 'שובר מיתוסים',
  reminder: 'תזכורת',
  quote: 'ציטוט',
}
