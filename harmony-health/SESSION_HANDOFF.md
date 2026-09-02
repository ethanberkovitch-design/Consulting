# Harmony Health — Session Handoff

מסמך העברה מלא לסשן חדש. הכל בעברית מלבד קוד/שמות טכניים.

---

## מה זה הפרויקט

**הרמוניה (Harmony Health)** — אפליקציית ליווי חכמה בעברית לירידה במשקל ואורח חיים בריא, מבוססת על "שיטת 5 העמודים" (תזונה, תנועה, שינה, ראש, מדידה).

- **קהל יעד:** לקוחות של יועצת תזונה/מאמנת אישית בישראל.
- **שפה:** עברית (RTL).
- **פריסה חיה:** https://eitan.cerevision.com/harmony-health
- **Repo:** `ethanberkovitch-design/consulting`
- **ענף עבודה:** `claude/nutrition-diet-expert-f36z1f`
- **תיקייה בקוד:** `/home/user/Consulting/harmony-health/`

---

## סטאק טכני

- **Frontend:** React 19.2.8 + TypeScript + Vite 8 + Tailwind CSS 4.3.3
- **Icons:** lucide-react 1.38.0
- **Auth:** SHA-256 + salt hashing (SubtleCrypto), נשמר ב-localStorage
- **State:** localStorage per-account (prefix `acc:{id}:`)
- **Build:** Vite → dist/ עם manualChunks per-screen
- **CDN:** esm.sh עבור react, react-dom, lucide-react (חסכון bundle)
- **Notifications:** Web Notifications API

---

## פריסה — Cerevision

הפריסה **לא אוטומטית**. יש להעלות ידנית ל-Cerevision דרך MCP tools.

### כלים
- `mcp__cerevision__list_files({project: "harmony-health"})`
- `mcp__cerevision__read_file({project, path})`
- `mcp__cerevision__write_file({project, path, content})`
- `mcp__cerevision__delete_file({project, path})`

### נוהל פריסה חשוב (Cerevision quirks)

1. **Auto-versioning:** כאשר כותבים לקובץ שכבר קיים, Cerevision יוצר `-timestamp.js` במקום לדרוס. הפתרון: **קודם `delete_file`, אחר כך `write_file`**.

2. **Cache-busting:** ב-`index.html` יש `?v=rN` על כל האסטים. **חייבים להעלות תמיד את כל 12 הצ׳אנקים + index.css + index.js + index.html יחד** ולעדכן את מספר הגרסה (r10, r11, ...).

3. **Import map חובה:** ה-`index.html` בסרבר חייב לכלול import map ל-esm.sh:
   ```html
   <script type="importmap">
   { "imports": {
       "react": "https://esm.sh/react@19.2.8",
       "react/jsx-runtime": "https://esm.sh/react@19.2.8/jsx-runtime",
       "react-dom": "https://esm.sh/react-dom@19.2.8?external=react",
       "react-dom/client": "https://esm.sh/react-dom@19.2.8/client?external=react",
       "lucide-react": "https://esm.sh/lucide-react@1.38.0?external=react"
   }}
   </script>
   ```
   אם ה-import map נעלם — האפליקציה לא עולה.

4. **גדלי קבצים לבדיקה** אחרי כל build (`wc -c dist/assets/*`):
   - chunk-dashboard.js ~37KB
   - chunk-data.js ~20KB (חייב לייצא `i`)
   - chunk-method.js ~20KB
   - chunk-onboarding.js ~33KB (מייבא `n` מ-chunk-method)
   - index.js ~13KB
   - index.css ~26KB

### תהליך build+deploy
```bash
cd /home/user/Consulting/harmony-health
npm run build
# אחר כך: לכל קובץ ב-dist/assets/, delete_file ואז write_file לגרסה החדשה
# עדכן index.html עם ?v=rN חדש והעלה
```

---

## מבנה הקוד

```
harmony-health/
├── index.html                  # source (Vite injects <script src> hashes)
├── src/
│   ├── App.tsx                 # main shell + nav
│   ├── main.tsx                # ReactDOM entry
│   ├── types.ts                # כל ה-TypeScript types
│   ├── components/
│   │   ├── Auth.tsx            # login/signup עם password reveal
│   │   ├── Onboarding.tsx      # 12-step onboarding wizard
│   │   ├── Dashboard.tsx
│   │   ├── FoodDiary.tsx
│   │   ├── MealPlan.tsx
│   │   ├── WeightTracker.tsx   # יש כפתור X לסגירה
│   │   ├── Workouts.tsx
│   │   ├── Habits.tsx
│   │   ├── Mindfulness.tsx
│   │   ├── Tips.tsx
│   │   ├── MethodPage.tsx      # 5 עמודים + PersonalMethodCard חדש
│   │   ├── ProfilePage.tsx
│   │   └── DailyCheckIn.tsx    # התראות + iOS/desktop help
│   ├── data/
│   │   └── methodologies.ts    # 10 שיטות דיאטה
│   ├── hooks/
│   │   ├── useAppData.ts       # per-account state hooks
│   │   └── useLocalState.ts
│   └── lib/
│       ├── accounts.ts         # signup/login/logout
│       ├── calculations.ts     # BMR, macros, projections
│       ├── storage.ts          # localStorage utilities
│       ├── methodology.ts      # PILLARS + METHOD_INTRO (original 5 pillars)
│       └── methodology-match.ts # matchMethodologies + weekly tracking helpers
└── dist/assets/                # build output
```

---

## תכונות שנבנו (Rounds 1–8)

### Rounds 1–6 (בסיס האפליקציה — הושלמו קודם)
- הרשמה/התחברות מקומית עם hashing
- Onboarding wizard רב-שלבי
- Dashboard, יומן אכילה, תפריט שבועי, מעקב משקל, אימונים, הרגלים, מיינדפולנס, טיפים, פרופיל
- שיטת 5 העמודים כעמוד חינוכי
- חישובי BMR, יעד קלוריות, מקרונים
- ניהול חשבונות עם isolation מלא ב-localStorage

### Round 7 — 3 תיקוני UX
1. **חישוב זמן ירידה ריאלי:** `projectedWeeksToGoal` תוקן ב-`src/lib/calculations.ts` — כשיש דדליין ריאלי, מחזיר `deadlineMonths * 4.33` במקום להשתמש ב-`projectedWeeklyLossKg` (שהיה עם floor על קלוריות ויצר תוצאות מעוותות כמו 154 שבועות במקום 34).
2. **כפתור X לסגירה במודלים:** נוסף ל-`WeightTracker.tsx` בכותרת המודל.
3. **הצג/הסתר סיסמה:** נוסף ל-`Auth.tsx` — Eye/EyeOff toggle לשדות סיסמה + אישור סיסמה.

### Round 8 — מנוע התאמת שיטה (Phase 1)
במקום שיטה קבועה של צום לסירוגין, המערכת עכשיו לומדת את המשתמש ומציעה שיטה מתאימה.

**10 שיטות ב-`src/data/methodologies.ts`:**
1. `intermittent_fasting` — צום לסירוגין
2. `calorie_counting` — ספירת קלוריות
3. `volumetrics` — Volumetrics
4. `mediterranean` — ים-תיכוני
5. `low_carb` — דל פחמימות / קטו
6. `high_protein` — עתיר חלבון
7. `plate_method` — שיטת הצלחת
8. `mindful_eating` — אכילה מודעת
9. `meal_replacements` — החלפות ארוחה
10. `habit_stacking` — הרגלים קטנים

לכל שיטה: `name, tagline, approach, bestFor, drawbacks, effort/structure/socialFit/kitchenTime/trackingLoad (1-5), sourcesShort`.

**מנוע ההתאמה ב-`src/lib/methodology-match.ts`:**
- `matchMethodologies(answers)` — מנקד את כל 10 מול 6 ממדים
- `suggestFor(answers)` — top + חלופות
- 6 שאלות ב-Onboarding step 8 (שלב "השיטה שלך"):
  - שגרת עבודה (office/flexible/shifts/travel)
  - זמן במטבח (less_15/15_30/more_30)
  - אכילה חברתית (rare/weekly/often)
  - סובלנות למעקב (love_it/short_term_ok/never)
  - ניסיון קודם (never_dieted/tried_and_failed/lost_but_regained/currently_succeeding)
  - עדיפות (fast_results/easy_routine/long_term_health/build_habits)

Onboarding עכשיו 12 שלבים (היה 11). ה-`methodology` וה-`methodologyReasons` נשמרים בפרופיל.

### Round 8 — תיקון התראות
`src/components/DailyCheckIn.tsx` — נוסף `notificationsSupported()` בדיקה + הודעת עזרה עם הוראות iOS/Desktop כשהרשאה נכשלה.

### Round 8 — Phase 2: מעקב שבועי + החלפת שיטה
**סוג נתונים חדש** ב-`types.ts`:
```typescript
export interface MethodologyCheckIn {
  id: string
  date: string
  methodology: MethodologyKey
  fit: 1 | 2 | 3 | 4 | 5
  notes?: string
}
```

**state חדש ב-`useAppData.ts`:** `methodologyCheckIns` + `addMethodologyCheckIn` (upsert לפי date+methodology).

**כרטיס חדש ב-`MethodPage.tsx`** (`PersonalMethodCard`):
- מציג את השיטה שבחר עם reasons
- 5 emoji לדירוג שבועי (😩😕🙂😃🤩)
- מציג ממוצע 4 שבועות אחרונים
- מזהה **3 שבועות רצוף בדירוג 1-2** → מציע החלפה
- picker של 9 השיטות האחרות
- החלפה בקליק אחד (שומר בהיסטוריה)

**Helpers:**
- `recentMethodologyFit(checkIns, key)` — {count, avg, lowStreak}
- `needsWeeklyCheckIn(checkIns, key)` — true אם עברו 7+ ימים

---

## ⚠️ Bug שנמצא ותוקן בסוף Round 8

**סימפטום:** האתר לא עלה אחרי דפלוימנט r9.

**סיבה שורש:** קובץ `chunk-data.js` על הסרבר היה גרסה ישנה (20007 bytes) שלא ייצאה את `i` (methodologyByKey). ה-`chunk-method.js` החדש עשה `import{i as t}from"./chunk-data.js"` — ImportError שקט הרס את כל הטעינה.

**פתרון:** delete + write של `chunk-data.js` הטרייה (20055 bytes) — עכשיו מייצאת `{t as i, n, e as r, r as t}`.

**לקח:** תמיד לוודא אחרי דפלוימנט שגדלי הקבצים על הסרבר תואמים ל-`dist/assets/*` המקומיים (±1 byte טולרנס בגלל trailing newlines).

---

## מצב נוכחי (2 בספטמבר 2026)

✅ **פועל בקצה:**
- כל 8 הסבבים הושלמו
- Cerevision r9 חי ופעיל
- כל ה-source committed ב-`claude/nutrition-diet-expert-f36z1f` (commit e0d194c)

⏳ **פתוח לבדיקה:**
- User צריך לאמת שהאתר עולה לו עכשיו אחרי תיקון chunk-data
- User צריך לבדוק את מסך "השיטה" + הדירוג השבועי + החלפת שיטה

---

## Repo git

- Remote: `git@github.com:ethanberkovitch-design/consulting.git`
- Branch עבודה: `claude/nutrition-diet-expert-f36z1f`
- Push תמיד עם: `git push -u origin claude/nutrition-diet-expert-f36z1f`

**חשוב:** אל תיצור PR אלא אם המשתמש מבקש במפורש.

---

## פרטי משתמש

- User: Ethan Berkovitch
- Email: ethan.berkovitch@gmail.com
- הוא בונה את זה עבור יועצת תזונה/מאמנת שלו (Client)
- User מדבר עברית (RTL) — תמיד לענות בעברית לתגובות עסקיות, קוד באנגלית

---

## פקודות שימושיות

```bash
# Build
cd /home/user/Consulting/harmony-health
npm run build

# בדיקת גדלים אחרי build
wc -c dist/assets/*

# בדיקת exports של chunk
tail -c 200 dist/assets/chunk-<name>.js

# Git status/commit/push
cd /home/user/Consulting
git status
git add harmony-health/src
git commit -m "..."
git push -u origin claude/nutrition-diet-expert-f36z1f
```

---

## אזהרות חשובות לסשן הבא

1. **לעולם לא** לדרוס את `src/lib/methodology.ts` — הוא מכיל את PILLARS+METHOD_INTRO המקוריים ש-`MethodPage.tsx` צריך. הקוד החדש של matching הוא ב-`methodology-match.ts`.

2. **לעולם לא** להעלות index.html ל-Cerevision בלי import map של esm.sh — האפליקציה לא תעלה.

3. אחרי כל build+deploy — לוודא שגדלי הקבצים על Cerevision תואמים למקומי. אם `chunk-data.js` על הסרבר קטן ב-45+ bytes מהמקומי — זה סימן שהוא stale ו-import חדש יכשל.

4. Cerevision list_files מציג הרבה `-timestamp.js` ישנים — זה בסדר, הם מהעבר. רק הקבצים בלי טיימסטמפ (`chunk-X.js` בדיוק) נטענים בפועל.

5. אין CI/testing אוטומטי — כל בדיקה היא ידנית דרך `npm run build` + פתיחת הדפדפן.

---

## הודעה פותחת מומלצת לסשן חדש

> אני ממשיך עבודה על אפליקציית Harmony Health (הרמוניה) — אפליקציית ליווי בעברית לירידה במשקל. הפרויקט ב-`/home/user/Consulting/harmony-health/`, ה-repo `ethanberkovitch-design/consulting`, branch `claude/nutrition-diet-expert-f36z1f`. הפריסה חיה ב-https://eitan.cerevision.com/harmony-health (r9). קרא את `SESSION_HANDOFF.md` במלואו לפני שאתה עושה שום דבר.
