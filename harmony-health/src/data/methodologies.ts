// Weight-loss methodologies we can recommend. Each one is a real, well-studied
// approach — the app doesn't invent methods, it matches the user to what
// exists. Scoring is done in ../lib/methodology.ts against a lifestyle profile.

export type MethodologyKey =
  | 'intermittent_fasting'
  | 'calorie_counting'
  | 'volumetrics'
  | 'mediterranean'
  | 'low_carb'
  | 'high_protein'
  | 'plate_method'
  | 'mindful_eating'
  | 'meal_replacements'
  | 'habit_stacking'

export interface Methodology {
  key: MethodologyKey
  name: string
  tagline: string
  approach: string
  bestFor: string[]
  drawbacks: string[]
  effort: 1 | 2 | 3 | 4 | 5      // 1 = very easy, 5 = demanding
  structure: 1 | 2 | 3 | 4 | 5    // 1 = flexible, 5 = strict
  socialFit: 1 | 2 | 3 | 4 | 5    // 5 = fits eating out / family meals easily
  kitchenTime: 1 | 2 | 3 | 4 | 5  // 5 = a lot of cooking required
  trackingLoad: 1 | 2 | 3 | 4 | 5 // 5 = counting every gram
  sourcesShort: string
}

export const METHODOLOGIES: Methodology[] = [
  {
    key: 'intermittent_fasting',
    name: 'צום לסירוגין',
    tagline: 'חלון אכילה קצוב — 16:8, 14:10 או 12:12',
    approach:
      'אוכלים בחלון זמן מוגדר וצמים בשאר היום. גורם לצמצום קלוריות טבעי, משפר רגישות לאינסולין, ומחייב פחות "החלטות" יומיות.',
    bestFor: ['אנשים שלא רעבים בבוקר', 'שגרה קבועה', 'אוהבים ארוחות גדולות', 'רוצים פחות לספור'],
    drawbacks: ['פחות מתאים למי שמתאמן בבוקר', 'לא מומלץ בהריון', 'אתגר חברתי בבוקר/ערב'],
    effort: 3,
    structure: 3,
    socialFit: 3,
    kitchenTime: 2,
    trackingLoad: 1,
    sourcesShort: 'Varady et al. — אחוזי הצלחה דומים לגירעון קלורי רגיל',
  },
  {
    key: 'calorie_counting',
    name: 'ספירת קלוריות',
    tagline: 'המפורסמת ביותר — עוקבים אחרי כל מה שאוכלים',
    approach:
      'מגדירים יעד יומי (כאן חושב לך אוטומטית) ורושמים כל ארוחה כדי לעמוד בו. הכי מדויק, גם הכי דורש מעקב.',
    bestFor: ['אוהבים נתונים ומספרים', 'רוצים שליטה מלאה', 'מתמידים במעקב', 'מתאמנים ברצינות'],
    drawbacks: ['דורש 5-10 דקות ביום', 'עלול ליצור אובססיה', 'קשה במסעדות'],
    effort: 4,
    structure: 4,
    socialFit: 3,
    kitchenTime: 3,
    trackingLoad: 5,
    sourcesShort: 'Hall & Kahan (2018) — הדיוק במעקב הוא המנבא הטוב ביותר',
  },
  {
    key: 'volumetrics',
    name: 'Volumetrics',
    tagline: 'ממלאים את הצלחת במזון בעל צפיפות קלורית נמוכה',
    approach:
      'מתמקדים במזונות עשירים במים וסיבים (ירקות, פירות, מרקים, קטניות) שמשביעים בלי הרבה קלוריות. אפשר לאכול הרבה — במקום לספור.',
    bestFor: ['רעבים תמידית', 'אוהבים אוכל אמיתי', 'מבשלים מהבסיס', 'רוצים בלי לספור'],
    drawbacks: ['דורש הכנה של ירקות', 'פחות מתאים למחפשי טעמים חזקים', 'הרבה בישול'],
    effort: 3,
    structure: 2,
    socialFit: 4,
    kitchenTime: 4,
    trackingLoad: 2,
    sourcesShort: 'Barbara Rolls — תוצאות טובות בלי מעקב מדוקדק',
  },
  {
    key: 'mediterranean',
    name: 'תזונה ים-תיכונית',
    tagline: 'שמן זית, דגים, קטניות, ירקות, יין באיפוק',
    approach:
      'סגנון חיים יותר מדיאטה. הרבה שומנים בריאים, חלבון מגוון, מיעוט בשר אדום ומעובד. עובד לטווח ארוך ומגן על הלב.',
    bestFor: ['רוצים אורח חיים ארוך טווח', 'אוהבים אוכל טעים', 'משפחה שאוכלת יחד', 'בעלי מחלות לב'],
    drawbacks: ['לא מהיר במיוחד', 'שמן זית ואגוזים יקרים', 'לא מגביל קלוריות ישירות'],
    effort: 2,
    structure: 2,
    socialFit: 5,
    kitchenTime: 4,
    trackingLoad: 1,
    sourcesShort: 'PREDIMED — הפחתה של 30% במחלות לב על פני 5 שנים',
  },
  {
    key: 'low_carb',
    name: 'דל פחמימות / קטו',
    tagline: 'פחות מ-100 גר\' פחמימות ליום (קטו: פחות מ-30)',
    approach:
      'מצמצמים סוכר וקמח, מגדילים חלבון ושומן בריא. יעיל במיוחד למי עם עמידות לאינסולין או PCOS. מפחית תיאבון אצל רבים.',
    bestFor: ['סובלים מסוכר גבוה', 'PCOS', 'רעב-סוכר קבוע', 'אוהבים בשר, ביצים, אבוקדו'],
    drawbacks: ['שבוע ראשון קשה (פלואי קטו)', 'קשה במסעדות ובאירועים', 'לא לספורטאי סבולת'],
    effort: 4,
    structure: 4,
    socialFit: 2,
    kitchenTime: 3,
    trackingLoad: 3,
    sourcesShort: 'Volek & Phinney — הפחתה מהירה של הידרציה בשומן ויסצרלי',
  },
  {
    key: 'high_protein',
    name: 'עתיר חלבון',
    tagline: '1.6–2.2 גר\' חלבון לכל ק"ג משקל',
    approach:
      'החלבון הוא המרכיב הכי משביע והכי משמר שריר. מבנים כל ארוחה סביבו. אין הגבלה אחרת — אוכלים לפי צורך.',
    bestFor: ['מתאמנים בכוח', 'רוצים לשמר שריר', 'תמיד רעבים', 'לא סובלים דיאטות שמגבילות'],
    drawbacks: ['יקר יותר', 'קשה לצמחונים', 'דורש תכנון'],
    effort: 3,
    structure: 3,
    socialFit: 4,
    kitchenTime: 3,
    trackingLoad: 3,
    sourcesShort: 'Helms, Aragon, Fitschen — 25% פחות שריר איבוד בגירעון',
  },
  {
    key: 'plate_method',
    name: 'שיטת הצלחת',
    tagline: '½ ירקות · ¼ חלבון · ¼ פחמימה מלאה',
    approach:
      'בלי לספור כלום — פשוט בונים כל צלחת לפי חלוקה קבועה. יעיל בסופו של דבר, פשוט לזכור, וידידותי במסעדות.',
    bestFor: ['לא אוהבים לספור', 'רוצים כלל אחד פשוט', 'משפחות עם ילדים', 'זמן מעט'],
    drawbacks: ['פחות מדויק', 'איטי יותר', 'לא מטפל בחטיפים'],
    effort: 1,
    structure: 2,
    socialFit: 5,
    kitchenTime: 3,
    trackingLoad: 1,
    sourcesShort: 'מודל USDA / הרווארד — יעיל בשילוב עם הפחתת חטיפים',
  },
  {
    key: 'mindful_eating',
    name: 'אכילה מודעת',
    tagline: 'לומדים לזהות רעב אמיתי לעומת רגשי',
    approach:
      'אין כללי מה לאכול — מתמקדים באיך: לועסים לאט, שמים לב לטעם, עוצרים כשמלאים. הכלי המרכזי נגד אכילה רגשית.',
    bestFor: ['אכילה רגשית', 'התקפי זלילה', 'ניסו הרבה דיאטות', 'רוצים שינוי עומק'],
    drawbacks: ['תוצאות איטיות יותר', 'דורש מודעות עצמית', 'לא מבטיח גירעון קלורי'],
    effort: 2,
    structure: 1,
    socialFit: 5,
    kitchenTime: 2,
    trackingLoad: 1,
    sourcesShort: 'Kristeller — יעיל מאוד למי שסובל מ-Binge Eating',
  },
  {
    key: 'meal_replacements',
    name: 'החלפות ארוחה',
    tagline: 'שייק/סלט מוכן מראש ל-1–2 ארוחות ביום',
    approach:
      'ארוחה 1-2 בכל יום היא החלפה מובנית (שייק, סלט מוכן, קופסה מותאמת). מבטל החלטות, מונע פיתויים, מדויק בקלוריות.',
    bestFor: ['לחוצי זמן', 'לא אוהבים לבשל', 'טסים הרבה', 'מקסימום 3-6 חודשים'],
    drawbacks: ['משעמם לטווח ארוך', 'עלות', 'לא מלמד הרגלים חדשים'],
    effort: 2,
    structure: 4,
    socialFit: 2,
    kitchenTime: 1,
    trackingLoad: 2,
    sourcesShort: 'Heymsfield — יעיל כדחיפה ראשונית, לא לטווח ארוך',
  },
  {
    key: 'habit_stacking',
    name: 'שיטת ההרגלים הקטנים',
    tagline: '1% שיפור ביום — שינוי אחד כל שבועיים',
    approach:
      'אין דיאטה מוגדרת. משנים הרגל אחד בכל פעם (כוס מים בבוקר → ירקות בכל ארוחה → הליכה אחרי אוכל). איטי אבל לעולם לא נשבר.',
    bestFor: ['נכשלו בדיאטות מהירות', 'רוצים שינוי לצמיתות', 'סבלנים', 'לא מתאמנים היום כלל'],
    drawbacks: ['תוצאות הכי איטיות', 'קשה לצפות מתי מגיעים ליעד', 'לא נותן הישגי wow'],
    effort: 1,
    structure: 1,
    socialFit: 5,
    kitchenTime: 2,
    trackingLoad: 1,
    sourcesShort: 'James Clear — הרגל שנשמר שנתיים יש 90% סיכוי להישאר',
  },
]

export function methodologyByKey(key: MethodologyKey | undefined): Methodology | undefined {
  return METHODOLOGIES.find(m => m.key === key)
}
