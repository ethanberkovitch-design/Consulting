# תורת הבטון — מצגת הדרכה

מצגת הדרכה (63 שקפים, 4-5 שעות) לאקדמיית הטכנולוגיה והאיכות של סולל בונה תעשיות, על בסיס הטמפלט הארגוני.

- `תורת-הבטון.pptx` — המצגת המוכנה
- `src/svg.js` — האיורים הווקטוריים (חתכים, ציוד בדיקה, כשלים)
- `src/assets.js` — מייצא את האיורים והאייקונים ל-PNG
- `src/build.py` — בונה את המצגת על גבי הטמפלט (python-pptx)

## בנייה מחדש

```bash
npm install
node src/assets.js build/assets
python3 src/build.py template/solel-boneh-template.pptx build/assets "תורת-הבטון.pptx"
```
