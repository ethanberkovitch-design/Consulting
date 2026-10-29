#!/usr/bin/env python3
"""בונה את הלומדה לקובץ HTML יחיד, עם האיורים מוטמעים.

שימוש:
    python3 build.py                      # בלי חיבור לגיליון (מצב הדגמה)
    python3 build.py --api https://script.google.com/macros/s/XXXX/exec

פלט:
    dist/index.html          לאחסון עצמאי (קישור רגיל)
    apps-script/index.html   להדבקה בפרויקט Apps Script, שמגיש את הלומדה בעצמו
"""
import argparse
import base64
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / 'src'


def images():
    data = {}
    for f in sorted((ROOT / 'assets').glob('*.webp')):
        data[f.stem] = 'data:image/webp;base64,' + base64.b64encode(f.read_bytes()).decode()
    return 'window.IMAGES=' + json.dumps(data) + ';'


def build(api_url):
    html = (SRC / 'index.html').read_text(encoding='utf-8')
    # הסדר חשוב: ה-placeholder של ה-API מוחלף לפני שמכניסים קוד שעלול להכיל טקסט דומה
    html = html.replace('/*@API_URL@*/', api_url.replace("'", ''))
    html = html.replace('/*@STYLES@*/', (SRC / 'styles.css').read_text(encoding='utf-8'))
    html = html.replace('/*@IMAGES@*/', images())
    html = html.replace('/*@CONTENT@*/', (SRC / 'content.js').read_text(encoding='utf-8'))
    html = html.replace('/*@APP@*/', (SRC / 'app.js').read_text(encoding='utf-8'))
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
    print(f'dist/index.html: {len(out.encode()) / 1024:.0f} KB')
