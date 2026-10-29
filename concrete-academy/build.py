#!/usr/bin/env python3
"""בונה את הלומדה לקובץ HTML יחיד, עם האיורים מוטמעים.

שימוש:
    python3 build.py                      # בלי חיבור לגיליון (מצב הדגמה)
    python3 build.py --api https://script.google.com/macros/s/XXXX/exec

פלט:
    dist/index.html          לאחסון עצמאי (קישור רגיל)
    dist/concrete-course-review.html   גרסת בחינה לסוקרים, עם מפתח תשובות
    dist/concrete-course-web.html      אותה גרסת בחינה, ניטרלית, לפרסום כקישור
    apps-script/index.html   להדבקה בפרויקט Apps Script, שמגיש את הלומדה בעצמו
"""
import argparse
import base64
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / 'src'


def images(neutral=False):
    data = {}
    for f in sorted((ROOT / 'assets').glob('*.webp')):
        if neutral and f.stem == 'img1':  # הלוגו
            continue
        data[f.stem] = 'data:image/webp;base64,' + base64.b64encode(f.read_bytes()).decode()
    return 'window.IMAGES=' + json.dumps(data) + ';'


def build(api_url, review=False, web=False):
    """web=True: גרסת קישור ציבורי. ניטרלית (בלי לוגו ושם החברה), בלי הדפסה,
    ובלי עטיפת doctype/head/body, שהמארח מוסיף בעצמו."""
    html = (SRC / 'index.html').read_text(encoding='utf-8')
    # הסדר חשוב: ה-placeholder של ה-API מוחלף לפני שמכניסים קוד שעלול להכיל טקסט דומה
    html = html.replace('/*@API_URL@*/', api_url.replace("'", ''))
    html = html.replace('/*@REVIEW@*/false', 'true' if review else 'false')
    html = html.replace('/*@NOPRINT@*/false', 'true' if web else 'false')
    html = html.replace('/*@STYLES@*/', (SRC / 'styles.css').read_text(encoding='utf-8'))
    html = html.replace('/*@IMAGES@*/', images(neutral=web))
    content = (SRC / 'content.js').read_text(encoding='utf-8')
    if web:
        content = content.replace('שיכון ובינוי סולל בונה', 'מפעלי הבטון')
    html = html.replace('/*@CONTENT@*/', content)
    html = html.replace('/*@APP@*/', (SRC / 'app.js').read_text(encoding='utf-8'))
    if web:
        for tag in ('<!doctype html>', '<html lang="he" dir="rtl">', '<head>', '<meta charset="utf-8">',
                    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
                    '</head>', '<body>', '</body>', '</html>'):
            html = html.replace(tag + '\n', '', 1)
        # המארח לא מגדיר כיווניות, אז מגדירים אותה על שורש הלומדה
        html = html.replace('<div id="app"></div>', '<div id="app" dir="rtl" lang="he"></div>')
    return html


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--api', default='', help='Apps Script Web App URL (ends with /exec)')
    args = ap.parse_args()

    out = build(args.api)
    (ROOT / 'dist').mkdir(exist_ok=True)
    (ROOT / 'dist' / 'index.html').write_text(out, encoding='utf-8')
    # בתוך Apps Script הלומדה מדברת עם השרת דרך google.script.run, ולכן לא צריך כתובת
    (ROOT / 'apps-script' / 'index.html').write_text(build(''), encoding='utf-8')
    # גרסה לסוקרים: חוויית עובד מלאה, פלוס מפתח תשובות. בלי חיבור לגיליון, כדי שבדיקות לא ייכנסו לתוצאות
    (ROOT / 'dist' / 'concrete-course-review.html').write_text(build('', review=True), encoding='utf-8')
    (ROOT / 'dist' / 'concrete-course-web.html').write_text(build('', review=True, web=True), encoding='utf-8')
    print(f'dist/index.html: {len(out.encode()) / 1024:.0f} KB')
