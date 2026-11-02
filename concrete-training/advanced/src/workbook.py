"""Exercise workbook for the advanced technologists' program.

Usage: python3 workbook.py <out.xlsx>
Every result is a live formula; yellow cells with blue text are the inputs a trainee edits.
Sample data is illustrative and is replaced with the plant's own data in the workshops.
"""
import sys

from openpyxl import Workbook
from openpyxl.chart import LineChart, Reference, ScatterChart, Series
from openpyxl.comments import Comment
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.worksheet.datavalidation import DataValidation

OUT = sys.argv[1]
NAVY, BLUE = "003973", "0081C8"
F = "Arial"

title_font = Font(name=F, size=14, bold=True, color=NAVY)
sub_font = Font(name=F, size=10, italic=True, color="5F6B76")
head_font = Font(name=F, size=11, bold=True, color="FFFFFF")
sec_font = Font(name=F, size=12, bold=True, color=NAVY)
label_font = Font(name=F, size=11, color="333F4A")
input_font = Font(name=F, size=11, color="0000FF")
calc_font = Font(name=F, size=11, color="000000")
link_font = Font(name=F, size=11, color="008000")
key_font = Font(name=F, size=11, bold=True, color="000000")
note_font = Font(name=F, size=9, color="5F6B76")
head_fill = PatternFill("solid", fgColor=NAVY)
input_fill = PatternFill("solid", fgColor="FFF2CC")
result_fill = PatternFill("solid", fgColor="EAF3FA")
key_fill = PatternFill("solid", fgColor="E3EFD2")
thin = Side(style="thin", color="B8C2CA")
box = Border(left=thin, right=thin, top=thin, bottom=thin)
RIGHT = Alignment(horizontal="right", vertical="center", wrap_text=True)
CENTER = Alignment(horizontal="center", vertical="center", wrap_text=True)

wb = Workbook()


def sheet(name, title, subtitle, widths):
    ws = wb.create_sheet(name)
    ws.sheet_view.rightToLeft = True
    ws.sheet_view.showGridLines = False
    ws["A1"] = title
    ws["A1"].font = title_font
    ws["A2"] = subtitle
    ws["A2"].font = sub_font
    for col, w in widths.items():
        ws.column_dimensions[col].width = w
    ws.page_setup.orientation = "landscape"
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    return ws


def header(ws, row, labels, col=1):
    for i, lab in enumerate(labels):
        c = ws.cell(row=row, column=col + i, value=lab)
        c.font, c.fill, c.alignment, c.border = head_font, head_fill, CENTER, box


def section(ws, ref, text):
    ws[ref] = text
    ws[ref].font = sec_font


def put(ws, ref, value, kind="calc", fmt=None, note=None):
    c = ws[ref]
    c.value = value
    c.font = {"input": input_font, "calc": calc_font, "link": link_font, "label": label_font,
              "key": key_font, "note": note_font}[kind]
    c.border = box
    c.alignment = CENTER if kind in ("input", "calc", "link", "key") else RIGHT
    if kind == "input":
        c.fill = input_fill
    if kind == "key":
        c.fill = result_fill
    if fmt:
        c.number_format = fmt
    if note:
        c.comment = Comment(note, "אקדמיית טכנולוגיה ואיכות")
    return c


def row(ws, r, label, value, kind, unit="", note="", fmt=None):
    put(ws, f"A{r}", label, "label")
    put(ws, f"B{r}", value, kind, fmt)
    put(ws, f"C{r}", unit, "label")
    if note:
        ws[f"D{r}"] = note
        ws[f"D{r}"].font = note_font
        ws[f"D{r}"].alignment = RIGHT


# ======================================================================= 0. instructions
ws = wb.active
ws.title = "הוראות"
ws.sheet_view.rightToLeft = True
ws.sheet_view.showGridLines = False
ws.column_dimensions["A"].width = 26
ws.column_dimensions["B"].width = 70
ws["A1"] = "חוברת תרגילים — תוכנית מתקדמת לטכנולוגים"
ws["A1"].font = title_font
ws["A2"] = "סולל בונה תעשיות | אקדמיית טכנולוגיה ואיכות"
ws["A2"].font = sub_font
section(ws, "A4", "מקרא צבעים")
put(ws, "A5", "קלט — לעריכה", "input")
put(ws, "B5", "תא צהוב עם טקסט כחול: מזינים כאן את נתוני המפעל", "label")
put(ws, "A6", "חישוב", "calc")
put(ws, "B6", "נוסחה — לא לערוך", "label")
put(ws, "A7", "קישור מגיליון אחר", "link")
put(ws, "B7", "טקסט ירוק: הערך מגיע מגיליון אחר בחוברת", "label")
put(ws, "A8", "תוצאה מרכזית", "key")
put(ws, "B8", "תא תכלת מודגש: המספר שעליו מחליטים", "label")
section(ws, "A10", "גיליונות")
sheets = [("תכן תערובת", "נפחים מוחלטים: מחוזק יעד ודרגת חשיפה לכמויות ל-1 מ\"ק (מודול 2)"),
          ("תיקון לחות", "מעבר מתערובת SSD למנה בפועל לפי לחות יומית (מודול 2)"),
          ("תערובות ניסיון", "עקומת W/C-חוזק מפעלית ותפוקה; מזינה את גיליון התכן (מודול 3)"),
          ("אבחון ותיקון", "ארבעה מקרי אבחון; עמודות המפתח למנחה — להסתיר לפני חלוקה (מודול 4)"),
          ("עלות ותרחישים", "עלות למ\"ק ושלושה תרחישי חיסכון עם חישוב שנתי (מודול 5)"),
          ("בקרה סטטיסטית", "ממוצע, סטיית תקן, ממוצע נע ו-CUSUM על סדרת קוביות (מודול 6)"),
          ("טמפרטורת בטון", "טמפרטורת התערובת הטרייה ותרחישי קירור ביום שרב (מודול 7)"),
          ("תיק תלונה", "תבנית תחקור: עובדות, ציר זמן, ראיות, ניתוח שורש והחלטה (מודול 8)")]
for i, (n, d) in enumerate(sheets):
    put(ws, f"A{11 + i}", n, "label").font = Font(name=F, size=11, bold=True, color=NAVY)
    put(ws, f"B{11 + i}", d, "label")
section(ws, "A20", "הערות חשובות")
notes = ["כל הנתונים בחוברת הם דוגמה להמחשה; בסדנה מחליפים אותם בנתוני המפעל.",
         "ערכים שמקורם בתקן (W/C מרבי, צמנט מזערי, מקדם מרווח) מסומנים \"לאימות מול ת\"י 118\" — יש לעדכן לפי המהדורה המחייבת.",
         "הנוסחאות ההנדסיות (נפחים מוחלטים, עקומת אברמס, טמפרטורת תערובת, CUSUM) הן כלים מקצועיים מקובלים ואינן דרישת תקן.",
         "המחירים בגיליון העלות הם דוגמה בלבד — יש להזין מחירי רכש עדכניים."]
for i, n in enumerate(notes):
    put(ws, f"A{21 + i}", f"{i + 1}.", "label")
    put(ws, f"B{21 + i}", n, "label")

# ======================================================================= 3. trial mixes (built first: design links to it)
tr = sheet("תערובות ניסיון", "תערובות ניסיון: עקומת W/C-חוזק מפעלית ותפוקה",
           "מזינים 3-5 תערובות שנבדלות רק ב-W/C. הקבועים A ו-B מזינים את גיליון התכן.",
           {"A": 16, "B": 12, "C": 12, "D": 16, "E": 14, "F": 14, "G": 12, "H": 14, "I": 12, "J": 12})
header(tr, 4, ["תערובת", "W/C", "סומך (מ\"מ)", "צפיפות (ק\"ג/מ\"ק)", "חוזק 7 (MPa)", "חוזק 28 (MPa)",
               "ln(חוזק 28)", "חוזק חזוי", "סטייה", "יחס 7/28"])
trials = [(0.40, 150, 2410, 38.5, 52.0), (0.45, 160, 2395, 34.0, 46.5), (0.50, 170, 2385, 29.5, 41.0),
          (0.55, 180, 2370, 25.5, 36.0), (0.60, 190, 2355, 22.0, 31.5)]
for i, (wc, sl, de, f7, f28) in enumerate(trials):
    r = 5 + i
    put(tr, f"A{r}", f"ניסיון {i + 1}", "label")
    put(tr, f"B{r}", wc, "input", "0.00")
    put(tr, f"C{r}", sl, "input", "0")
    put(tr, f"D{r}", de, "input", "#,##0")
    put(tr, f"E{r}", f7, "input", "0.0")
    put(tr, f"F{r}", f28, "input", "0.0")
    put(tr, f"G{r}", f"=LN(F{r})", "calc", "0.000")
    put(tr, f"H{r}", f"=$B$13*$B$14^(-B{r})", "calc", "0.0")
    put(tr, f"I{r}", f"=F{r}-H{r}", "calc", "0.0")
    put(tr, f"J{r}", f"=E{r}/F{r}", "calc", "0%")
section(tr, "A12", "עקומת המפעל: חוזק = A / B^(W/C)")
row(tr, 13, "קבוע A", "=EXP(INTERCEPT(G5:G9,B5:B9))", "key", "MPa", "מחושב מהרגרסיה", "0.0")
row(tr, 14, "קבוע B", "=EXP(-SLOPE(G5:G9,B5:B9))", "key", "", "", "0.00")
row(tr, 15, "R²", "=RSQ(G5:G9,B5:B9)", "calc", "", "מעל 0.95 — עקומה אמינה", "0.000")
row(tr, 16, "יחס ממוצע 7/28", "=AVERAGE(J5:J9)", "calc", "", "לחיזוי חוזק 28 מקוביות 7 ימים", "0%")
section(tr, "A19", "תפוקה (Yield)")
row(tr, 20, "מסת המנה שנשקלה", 19000, "input", "ק\"ג", "סכום תעודת השקילה", "#,##0")
row(tr, 21, "נפח מתוכנן", 8, "input", "מ\"ק", "", "0.0")
row(tr, 22, "צפיפות שנמדדה", 2360, "input", "ק\"ג/מ\"ק", "בדיקת צפיפות לפי ת\"י 26 חלק 2", "#,##0")
row(tr, 23, "נפח בפועל", "=B20/B22", "calc", "מ\"ק", "", "0.00")
row(tr, 24, "תפוקה יחסית", "=B23/B21", "key", "", "מתחת ל-100%: הלקוח מקבל פחות בטון ממה ששילם", "0.0%")
ch = ScatterChart()
ch.title = "W/C מול חוזק 28 יום"
ch.style = 13
ch.x_axis.title = "W/C"
ch.y_axis.title = "MPa"
xs = Reference(tr, min_col=2, min_row=5, max_row=9)
s1 = Series(Reference(tr, min_col=6, min_row=4, max_row=9), xs, title_from_data=True)
s1.marker.symbol = "circle"
s1.graphicalProperties.line.noFill = True
s2 = Series(Reference(tr, min_col=8, min_row=4, max_row=9), xs, title_from_data=True)
s2.marker.symbol = "none"
ch.series.extend([s1, s2])
ch.height, ch.width = 7.5, 13
tr.add_chart(ch, "L4")

# ======================================================================= 1. mix design
ds = sheet("תכן תערובת", "תכן תערובת בשיטת הנפחים המוחלטים",
           "מזינים את הדרישות; הגיליון מחשב W/C, צמנט וכמויות ל-1 מ\"ק במצב SSD.",
           {"A": 34, "B": 14, "C": 14, "D": 52})
section(ds, "A4", "נתוני קלט")
header(ds, 4, ["פרמטר", "ערך", "יחידה", "מקור / הערה"])
row(ds, 5, "חוזק אופייני (דרגת החוזק)", 30, "input", "MPa", "ב-30 לפי ת\"י 118", "0.0")
row(ds, 6, "סטיית תקן מפעלית σ", 4.0, "input", "MPa", "מגיליון בקרה סטטיסטית / נתוני המפעל", "0.0")
row(ds, 7, "מקדם מרווח k", 1.64, "input", "", "מרווח טיפוסי — לאימות מול ת\"י 118", "0.00")
row(ds, 8, "W/C מרבי לדרגת החשיפה", 0.60, "input", "", "מטבלת ת\"י 118 — לאימות", "0.00")
row(ds, 9, "תכולת צמנט מזערית", 280, "input", "ק\"ג/מ\"ק", "מטבלת ת\"י 118 — לאימות", "0")
row(ds, 10, "דרישת מים", 185, "input", "ליטר/מ\"ק", "לפי סומך וגודל אגרגט, מתערובות קיימות", "0")
row(ds, 11, "תכולת אוויר", 1.5, "input", "%", "אוויר כלוא טיפוסי", "0.0")
row(ds, 12, "אפר פחם (אופציונלי)", 0, "input", "ק\"ג/מ\"ק", "", "0")
row(ds, 13, "מינון מוסף", 0.8, "input", "% מהחומר המלכד", "לפי המלצת היצרן", "0.00")
row(ds, 14, "צפיפות צמנט", 3.10, "input", "ק\"ג/ליטר", "", "0.00")
row(ds, 15, "צפיפות אפר פחם", 2.20, "input", "ק\"ג/ליטר", "", "0.00")
row(ds, 16, "צפיפות מוסף", 1.08, "input", "ק\"ג/ליטר", "", "0.00")
row(ds, 17, "צפיפות חול (SSD)", 2.62, "input", "ק\"ג/ליטר", "", "0.00")
row(ds, 18, "צפיפות חצץ דק (SSD)", 2.68, "input", "ק\"ג/ליטר", "", "0.00")
row(ds, 19, "צפיפות חצץ גס (SSD)", 2.70, "input", "ק\"ג/ליטר", "", "0.00")
row(ds, 20, "חלק החול מנפח האגרגט", 0.45, "input", "", "", "0%")
row(ds, 21, "חלק החצץ הדק", 0.20, "input", "", "", "0%")
row(ds, 22, "חלק החצץ הגס", "=1-B20-B21", "calc", "", "", "0%")
row(ds, 23, "קבוע A של עקומת המפעל", "='תערובות ניסיון'!B13", "link", "MPa", "מגיליון תערובות ניסיון", "0.0")
row(ds, 24, "קבוע B של עקומת המפעל", "='תערובות ניסיון'!B14", "link", "", "", "0.00")
section(ds, "A26", "חישוב")
row(ds, 27, "חוזק יעד  =  fck + k·σ", "=B5+B7*B6", "calc", "MPa", "", "0.0")
row(ds, 28, "W/C הנדרש לחוזק", "=LN(B23/B27)/LN(B24)", "calc", "", "מעקומת המפעל", "0.00")
row(ds, 29, "W/C לתכן", "=MIN(B28,B8)", "key", "", "הנמוך מבין דרישת החוזק ודרישת החשיפה", "0.00")
row(ds, 30, "צמנט", "=MAX(B10/B29-B12,B9)", "key", "ק\"ג/מ\"ק", "", "0")
row(ds, 31, "מוסף", "=(B30+B12)*B13/100", "calc", "ק\"ג/מ\"ק", "", "0.00")
row(ds, 32, "נפח צמנט, אפר, מים, מוסף ואוויר", "=B30/B14+B12/B15+B10+B31/B16+B11*10", "calc", "ליטר", "", "0")
row(ds, 33, "נפח האגרגטים", "=1000-B32", "calc", "ליטר", "", "0")
section(ds, "A35", "התערובת ל-1 מ\"ק (SSD)")
header(ds, 35, ["רכיב", "ק\"ג/מ\"ק", "נפח (ליטר)"])
mix = [("צמנט", "=B30", "=B30/B14"), ("אפר פחם", "=B12", "=B12/B15"), ("מים", "=B10", "=B10"),
       ("מוסף", "=B31", "=B31/B16"), ("אוויר", 0, "=B11*10"), ("חול", "=B33*B20*B17", "=B33*B20"),
       ("חצץ דק", "=B33*B21*B18", "=B33*B21"), ("חצץ גס", "=B33*B22*B19", "=B33*B22")]
for i, (n, kg, vol) in enumerate(mix):
    r = 36 + i
    put(ds, f"A{r}", n, "label")
    put(ds, f"B{r}", kg, "calc", "0.0" if n == "מוסף" else "0")
    put(ds, f"C{r}", vol, "calc", "0")
put(ds, "A44", "סה\"כ / צפיפות תאורטית", "label").font = Font(name=F, size=11, bold=True, color=NAVY)
put(ds, "B44", "=SUM(B36:B43)", "key", "#,##0")
put(ds, "C44", "=SUM(C36:C43)", "key", "0")
put(ds, "A45", "בדיקה: W/C בפועל מול המרבי", "label")
put(ds, "B45", "=B38/B36", "calc", "0.00")
put(ds, "C45", "=IF(B45<=B8+0.0001,\"עומד\",\"חורג\")", "key")

# ======================================================================= 2. moisture correction
mo = sheet("תיקון לחות", "תיקון לחות: מתערובת SSD למנה בפועל",
           "מזינים לחות וספיגות עדכניות. הגיליון מחשב משקל רטוב לשקילה ואת המים שיש להפחית.",
           {"A": 30, "B": 14, "C": 14, "D": 14, "E": 18, "F": 18, "G": 16})
row(mo, 4, "גודל המנה", 8, "input", "מ\"ק", "", "0.0")
header(mo, 6, ["אגרגט", "SSD (ק\"ג/מ\"ק)", "לחות כוללת", "ספיגות", "משקל רטוב לשקילה", "מים חופשיים (ל'/מ\"ק)", "רטוב למנה (ק\"ג)"])
agg = [("חול", "'תכן תערובת'!B41", 0.05, 0.015), ("חצץ דק", "'תכן תערובת'!B42", 0.01, 0.010),
       ("חצץ גס", "'תכן תערובת'!B43", 0.005, 0.012)]
for i, (n, ref, m, a) in enumerate(agg):
    r = 7 + i
    put(mo, f"A{r}", n, "label")
    put(mo, f"B{r}", f"={ref}", "link", "0")
    put(mo, f"C{r}", m, "input", "0.0%")
    put(mo, f"D{r}", a, "input", "0.0%")
    put(mo, f"E{r}", f"=B{r}*(1+C{r})/(1+D{r})", "calc", "0")
    put(mo, f"F{r}", f"=B{r}*(C{r}-D{r})/(1+D{r})", "calc", "0.0")
    put(mo, f"G{r}", f"=E{r}*$B$4", "calc", "#,##0")
row(mo, 11, "מי התכן", "='תכן תערובת'!B38", "link", "ליטר/מ\"ק", "", "0")
row(mo, 12, "מים חופשיים מהאגרגט", "=SUM(F7:F9)", "calc", "ליטר/מ\"ק", "ערך חיובי = מים שנכנסים עם האגרגט", "0.0")
row(mo, 13, "מים לשקילה", "=B11-B12", "key", "ליטר/מ\"ק", "", "0")
row(mo, 14, "מים לשקילה למנה", "=B13*B4", "key", "ליטר", "", "#,##0")
row(mo, 15, "צמנט למנה", "='תכן תערובת'!B36*B4", "link", "ק\"ג", "", "#,##0")
section(mo, "A17", "מה קורה אם לא מתקנים")
row(mo, 18, "W/C בפועל בלי תיקון", "=(B11+B12)/'תכן תערובת'!B36", "calc", "", "", "0.00")
row(mo, 19, "חוזק צפוי לפי התכן", "='תכן תערובת'!B23*'תכן תערובת'!B24^(-'תכן תערובת'!B29)", "calc", "MPa", "", "0.0")
row(mo, 20, "חוזק צפוי בלי תיקון", "='תכן תערובת'!B23*'תכן תערובת'!B24^(-B18)", "calc", "MPa", "", "0.0")
row(mo, 21, "ירידת חוזק", "=1-B20/B19", "key", "", "מעקומת המפעל", "0%")

# ======================================================================= 4. diagnosis cases
dg = sheet("אבחון ותיקון", "אבחון ותיקון תערובות: ארבעה מקרים",
           "המשתתפים ממלאים את העמודות הצהובות. עמודות המפתח (H-I) — להסתיר לפני החלוקה.",
           {"A": 8, "B": 26, "C": 44, "D": 30, "E": 28, "F": 28, "G": 22, "H": 40, "I": 34})
header(dg, 4, ["מקרה", "תסמין", "נתונים", "שאלות מנחות", "האבחנה שלך", "תיקון מוצע", "מדד הצלחה",
               "מפתח למנחה: אבחנה", "מפתח למנחה: תיקון"])
cases = [("חוזק 28 יום ירד מממוצע 38 ל-33 MPa בשלושה שבועות",
          "סומך תקין. ספק החול הוחלף לפני חודש. שווה חול ירד מ-72 ל-58. אין שינוי בצמנט ובמוסף.",
          "מה השתנה ומתי? האם הירידה בכל הדרגות? מה מראה ה-CUSUM?",
          "דקים חרסיתיים בחול החדש: דרישת מים ומוסף עולות, החוזק יורד",
          "הסגר משלוחים, חזרה למקור הקודם או שטיפה; בדיקת כחול מתילן; תיקון זמני של W/C"),
         ("איבוד סומך בהובלה: 160 מ\"מ במפעל, 80 מ\"מ באתר אחרי 75 דקות",
          "יולי, טמפרטורת בטון 33°C, ללא מעכב. הצוות באתר מבקש להוסיף מים.",
          "מה תורם לאיבוד הסומך? אילו כלים יש במפעל? מה אסור לעשות באתר?",
          "חום וזמן הובלה מאיצים את ההתקשרות ואת איבוד הסומך",
          "מעכב במינון קיץ, מים קרים, יציקה בשעות קרירות, תיאום זמנים; לעולם לא מים באתר"),
         ("דימום ואבקיות בפני השטח של רצפות",
          "עקום הדירוג של החול השתנה: פחות עובר בנפה 0.15. W/C ללא שינוי.",
          "מה תפקיד הדקים בתערובת? מה ההשפעה על הדימום?",
          "מחסור בדקים: התערובת מאבדת קוהזיה ומדממת",
          "הגדלת חלק החול או תוספת דקים / אפר פחם; בדיקת הדימום בתערובת ניסיון"),
         ("סומך לא יציב בין משאיות של אותה תערובת",
          "פיזור 60-180 מ\"מ באותו יום. חיישן הלחות במגורת החול לא כויל חצי שנה.",
          "איפה נכנס המים \"הנסתר\"? איך מוודאים את החיישן?",
          "חיישן לחות לא מכויל: תיקון המים שגוי ומשתנה",
          "כיול החיישן, בדיקת לחות ידנית יומית והשוואה, הוספה לתכנית הבקרה")]
for i, (sym, data, q, k1, k2) in enumerate(cases):
    r = 5 + i
    dg.row_dimensions[r].height = 78
    put(dg, f"A{r}", i + 1, "calc")
    put(dg, f"B{r}", sym, "label")
    put(dg, f"C{r}", data, "label")
    put(dg, f"D{r}", q, "label")
    for col in "EFG":
        put(dg, f"{col}{r}", None, "input")
        dg[f"{col}{r}"].alignment = RIGHT
    put(dg, f"H{r}", k1, "label").fill = key_fill
    put(dg, f"I{r}", k2, "label").fill = key_fill

# ======================================================================= 5. cost & scenarios
co = sheet("עלות ותרחישים", "עלות למ\"ק ותרחישי חיסכון",
           "המחירים הם דוגמה — מזינים מחירי רכש עדכניים. הכמויות מגיעות מגיליון התכן.",
           {"A": 38, "B": 14, "C": 16, "D": 16, "E": 40})
section(co, "A4", "מחירים")
header(co, 4, ["חומר", "מחיר", "יחידה"], col=1)
prices = [("צמנט", 460, "₪/טון"), ("אפר פחם", 180, "₪/טון"), ("מוסף", 6.5, "₪/ק\"ג"), ("חול", 55, "₪/טון"),
          ("חצץ דק", 60, "₪/טון"), ("חצץ גס", 58, "₪/טון"), ("מים", 8, "₪/מ\"ק")]
for i, (n, p, u) in enumerate(prices):
    r = 5 + i
    put(co, f"A{r}", n, "label")
    put(co, f"B{r}", p, "input", "0.00")
    put(co, f"C{r}", u, "label")
section(co, "A13", "עלות התערובת הנוכחית")
header(co, 13, ["רכיב", "כמות", "עלות (₪/מ\"ק)"])
base = [("צמנט", "'תכן תערובת'!B36", "=B14*B5/1000"), ("אפר פחם", "'תכן תערובת'!B37", "=B15*B6/1000"),
        ("מוסף", "'תכן תערובת'!B39", "=B16*B7"), ("חול", "'תכן תערובת'!B41", "=B17*B8/1000"),
        ("חצץ דק", "'תכן תערובת'!B42", "=B18*B9/1000"), ("חצץ גס", "'תכן תערובת'!B43", "=B19*B10/1000"),
        ("מים", "'תכן תערובת'!B38", "=B20*B11/1000")]
for i, (n, ref, cost) in enumerate(base):
    r = 14 + i
    put(co, f"A{r}", n, "label")
    put(co, f"B{r}", f"={ref}", "link", "0.0")
    put(co, f"C{r}", cost, "calc", "0.00")
put(co, "A21", "סה\"כ חומרים", "label").font = Font(name=F, size=11, bold=True, color=NAVY)
put(co, "C21", "=SUM(C14:C20)", "key", "#,##0.00")
put(co, "A22", "חלק הצמנט בעלות", "label")
put(co, "C22", "=C14/C21", "calc", "0%")
row(co, 24, "היקף ייצור שנתי של התערובת", 150000, "input", "מ\"ק", "", "#,##0")

section(co, "A26", "תרחיש 1 — הקטנת סטיית התקן")
row(co, 27, "σ חדשה", 3.0, "input", "MPa", "אחרי שיפור הבקרה", "0.0")
row(co, 28, "חוזק יעד חדש", "='תכן תערובת'!B5+'תכן תערובת'!B7*B27", "calc", "MPa", "", "0.0")
row(co, 29, "W/C חדש", "=MIN(LN('תכן תערובת'!B23/B28)/LN('תכן תערובת'!B24),'תכן תערובת'!B8)", "calc", "", "", "0.00")
row(co, 30, "צמנט חדש", "=MAX('תכן תערובת'!B10/B29-'תכן תערובת'!B12,'תכן תערובת'!B9)", "calc", "ק\"ג/מ\"ק", "", "0")
row(co, 31, "חיסכון למ\"ק", "=(B14-B30)*B5/1000", "key", "₪/מ\"ק", "צמנט בלבד; שינוי האגרגט זניח", "0.00")
row(co, 32, "חיסכון שנתי", "=B31*B24", "key", "₪", "", "#,##0")

section(co, "A34", "תרחיש 2 — החלפת חלק מהצמנט באפר פחם")
row(co, 35, "שיעור החלפה מהחומר המלכד", 0.20, "input", "", "", "0%")
row(co, 36, "מקדם יעילות של האפר (k)", 0.4, "input", "", "ערך מקובל להמחשה — לאשר בתערובות ניסיון", "0.00")
row(co, 37, "חומר מלכד כולל", "='תכן תערובת'!B10/('תכן תערובת'!B29*(1-B35+B36*B35))", "calc", "ק\"ג/מ\"ק", "שומר על W/(C+k·F) של התכן", "0")
row(co, 38, "צמנט", "=B37*(1-B35)", "calc", "ק\"ג/מ\"ק", "לוודא מול הצמנט המזערי בת\"י 118", "0")
row(co, 39, "אפר פחם", "=B37*B35", "calc", "ק\"ג/מ\"ק", "", "0")
row(co, 40, "חיסכון למ\"ק", "=B14*B5/1000-(B38*B5+B39*B6)/1000", "key", "₪/מ\"ק", "שלילי = התרחיש מייקר", "0.00")
row(co, 41, "חיסכון שנתי", "=B40*B24", "key", "₪", "", "#,##0")

section(co, "A43", "תרחיש 3 — מוסף יעיל יותר (הפחתת מים)")
row(co, 44, "הפחתת מים", 10, "input", "ליטר/מ\"ק", "", "0")
row(co, 45, "מחיר המוסף החדש", 8.0, "input", "₪/ק\"ג", "", "0.00")
row(co, 46, "צמנט חדש", "=MAX(('תכן תערובת'!B10-B44)/'תכן תערובת'!B29-'תכן תערובת'!B12,'תכן תערובת'!B9)", "calc", "ק\"ג/מ\"ק", "אותו W/C, פחות מים", "0")
row(co, 47, "עלות מוסף חדשה", "=(B46+'תכן תערובת'!B12)*'תכן תערובת'!B13/100*B45", "calc", "₪/מ\"ק", "", "0.00")
row(co, 48, "חיסכון למ\"ק", "=(B14-B46)*B5/1000-(B47-C16)", "key", "₪/מ\"ק", "", "0.00")
row(co, 49, "חיסכון שנתי", "=B48*B24", "key", "₪", "", "#,##0")

# ======================================================================= 6. statistical control
sc = sheet("בקרה סטטיסטית", "בקרה סטטיסטית: ממוצע נע ו-CUSUM",
           "מדביקים את תוצאות קוביות 28 יום לפי סדר היציקה. ה-CUSUM מגלה מגמה לפני שהממוצע \"נשבר\".",
           {"A": 8, "B": 14, "C": 14, "D": 12, "E": 12, "F": 12, "G": 12, "H": 4, "I": 34, "J": 14})
header(sc, 4, ["מס'", "חוזק 28 (MPa)", "ממוצע נע (3)", "יעד", "חוזק אופייני", "CUSUM", "התראה"])
data = [37.1, 35.5, 37.8, 35.2, 36.7, 38.2, 35.9, 36.4, 35.1, 37.5, 36.3, 35.7, 37.4, 36.2, 36.6,
        35.6, 36.0, 34.9, 35.8, 35.1, 34.6, 35.3, 34.2, 35.7, 34.4, 33.8, 35.0, 33.9, 34.5, 33.4,
        34.1, 33.2, 34.6, 33.0, 33.7, 32.8, 33.9, 32.6, 33.4, 32.9]
for i, v in enumerate(data):
    r = 5 + i
    put(sc, f"A{r}", i + 1, "calc", "0")
    put(sc, f"B{r}", v, "input", "0.0")
    put(sc, f"C{r}", f"=IF(A{r}>=3,AVERAGE(B{r - 2}:B{r}),\"\")" if i >= 2 else "", "calc", "0.0")
    put(sc, f"D{r}", "=$J$5", "calc", "0.0")
    put(sc, f"E{r}", "=$J$6", "calc", "0.0")
    put(sc, f"F{r}", f"=B{r}-$J$5" if i == 0 else f"=F{r - 1}+B{r}-$J$5", "calc", "0.0")
    put(sc, f"G{r}", f"=IF(F{r}<-$J$7,\"לבדוק\",\"\")", "calc")
last = 4 + len(data)
section(sc, "I4", "פרמטרים")
for r, (lab, val, kind, fmt) in enumerate([("ממוצע יעד", "='תכן תערובת'!B27", "link", "0.0"),
                                            ("חוזק אופייני", "='תכן תערובת'!B5", "link", "0.0"),
                                            ("סף התראה h ל-CUSUM", "=2*'תכן תערובת'!B6", "input", "0.0")], start=5):
    put(sc, f"I{r}", lab, "label")
    put(sc, f"J{r}", val, kind, fmt)
sc["J7"].comment = Comment("ברירת מחדל 2σ — לקבוע לפי נוהל המפעל", "אקדמיית טכנולוגיה ואיכות")
section(sc, "I9", "סטטיסטיקה")
stats = [("מספר תוצאות", f"=COUNT(B5:B{last})", "0"), ("ממוצע", f"=AVERAGE(B5:B{last})", "0.0"),
         ("סטיית תקן", f"=STDEV(B5:B{last})", "0.00"), ("מקדם שונות", "=J12/J11", "0.0%"),
         ("מינימום", f"=MIN(B5:B{last})", "0.0"), ("תוצאות מתחת לחוזק האופייני", f"=COUNTIF(B5:B{last},\"<\"&J6)", "0"),
         ("ממוצע 10 התוצאות האחרונות", f"=AVERAGE(B{last - 9}:B{last})", "0.0"),
         ("הערכת חוזק אופייני  =  ממוצע − 1.64σ", "=J11-1.64*J12", "0.0"),
         ("תוצאות בהתראת CUSUM", f"=COUNTIF(G5:G{last},\"לבדוק\")", "0")]
for i, (lab, f, fmt) in enumerate(stats):
    r = 10 + i
    put(sc, f"I{r}", lab, "label")
    put(sc, f"J{r}", f, "key" if i in (6, 7) else "calc", fmt)
sc["I21"] = "קריטריוני ההתאמה המחייבים — לפי ת\"י 118 (לאימות במהדורה המחייבת)"
sc["I21"].font = note_font
lc = LineChart()
lc.title = "תוצאות, ממוצע נע ויעד"
lc.y_axis.title = "MPa"
lc.x_axis.title = "מס' דגימה"
lc.add_data(Reference(sc, min_col=2, max_col=5, min_row=4, max_row=last), titles_from_data=True)
lc.set_categories(Reference(sc, min_col=1, min_row=5, max_row=last))
lc.height, lc.width = 8, 16
sc.add_chart(lc, "I23")
cc = LineChart()
cc.title = "CUSUM — ירידה מתמשכת = מגמה"
cc.add_data(Reference(sc, min_col=6, min_row=4, max_row=last), titles_from_data=True)
cc.set_categories(Reference(sc, min_col=1, min_row=5, max_row=last))
cc.height, cc.width = 7, 16
sc.add_chart(cc, "I40")

# ======================================================================= 7. fresh concrete temperature
tp = sheet("טמפרטורת בטון", "טמפרטורת הבטון הטרי ותרחישי קירור",
           "T = [0.22(Ta·Wa + Tc·Wc) + Tw·Ww + Ta·Wwa − 80·Wi] / [0.22(Wa + Wc) + Ww + Wi + Wwa]",
           {"A": 36, "B": 16, "C": 16, "D": 16, "E": 30})
section(tp, "A4", "מסות ל-1 מ\"ק")
row(tp, 5, "אגרגטים (SSD), Wa", "='תכן תערובת'!B41+'תכן תערובת'!B42+'תכן תערובת'!B43", "link", "ק\"ג", "", "#,##0")
row(tp, 6, "צמנט וחומר מלכד, Wc", "='תכן תערובת'!B36+'תכן תערובת'!B37", "link", "ק\"ג", "", "0")
row(tp, 7, "מים חופשיים על האגרגט, Wwa", "='תיקון לחות'!B12", "link", "ק\"ג", "", "0.0")
row(tp, 8, "מים לשקילה (נוזל + קרח)", "='תיקון לחות'!B13", "link", "ק\"ג", "", "0")
row(tp, 9, "גבול טמפרטורה במפרט", 32, "input", "°C", "לפי המפרט / ת\"י 467 — לאימות", "0")
section(tp, "A11", "תרחישים")
header(tp, 11, ["פרמטר", "בסיס", "מים מקוררים", "מים מקוררים + קרח"])
scen = [("טמפרטורת אגרגטים, Ta (°C)", 32, 32, 32), ("טמפרטורת צמנט, Tc (°C)", 60, 60, 60),
        ("טמפרטורת מים, Tw (°C)", 28, 8, 8), ("קרח, Wi (ק\"ג)", 0, 0, 40)]
for i, vals in enumerate(scen):
    r = 12 + i
    put(tp, f"A{r}", vals[0], "label")
    for j, col in enumerate("BCD"):
        put(tp, f"{col}{r}", vals[j + 1], "input", "0")
for col in "BCD":
    put(tp, f"{col}16", f"=$B$8-{col}15", "calc", "0")
    put(tp, f"{col}17", f"=(0.22*({col}12*$B$5+{col}13*$B$6)+{col}14*{col}16+{col}12*$B$7-80*{col}15)/(0.22*($B$5+$B$6)+{col}16+{col}15+$B$7)", "key", "0.0")
    put(tp, f"{col}18", f"=IF({col}17<=$B$9,\"עומד\",\"מעל הגבול\")", "calc")
put(tp, "A16", "מים נוזליים, Ww (ק\"ג)", "label")
put(tp, "A17", "טמפרטורת הבטון הטרי (°C)", "label").font = Font(name=F, size=11, bold=True, color=NAVY)
put(tp, "A18", "מול גבול המפרט", "label")
tp["A20"] = "הנוסחה היא כלי הנדסי מקובל להערכה; הטמפרטורה בפועל נמדדת בבטון הטרי."
tp["A20"].font = note_font

# ======================================================================= 8. complaint file
cp = sheet("תיק תלונה", "תיק תחקור תלונה",
           "ממלאים לפי הסדר. כל טענה בתיק נשענת על ראיה: תעודה, תוצאה או תמונה.",
           {"A": 30, "B": 22, "C": 30, "D": 22, "E": 26})
section(cp, "A4", "פרטי התלונה")
fields = ["לקוח ואתר", "תאריך הקליטה", "קולט התלונה", "תאריך יציקה", "מס' תעודות משלוח",
          "תערובת ודרגת חוזק", "דרגת חשיפה (ת\"י 118)", "אלמנט", "תיאור התלונה במילות הלקוח"]
for i, f in enumerate(fields):
    put(cp, f"A{5 + i}", f, "label")
    cp.merge_cells(f"B{5 + i}:E{5 + i}")
    put(cp, f"B{5 + i}", None, "input")
section(cp, "A15", "ציר זמן")
header(cp, 15, ["מועד", "אירוע", "מקור הנתון", "אחראי", "הערה"])
put(cp, "A16", "07:10", "input")
put(cp, "B16", "יציאת משאית ראשונה", "input")
put(cp, "C16", "תעודת משלוח", "input")
put(cp, "D16", "", "input")
put(cp, "E16", "שורת דוגמה — למחוק", "input")
for r in range(17, 23):
    for col in "ABCDE":
        put(cp, f"{col}{r}", None, "input")
section(cp, "A24", "ראיות שנאספו")
evidence = ["רשומות שקילה ותעודות משלוח", "תוצאות קוביות של אותו יום", "בדיקות בטון טרי באתר",
            "קרוטים / בדיקות לא הורסות (ת\"י 26)", "תמונות ומדידות מהאתר", "נתוני מזג אוויר ושעות יציקה"]
dv = DataValidation(type="list", formula1='"נאסף,חסר,לא רלוונטי"', allow_blank=True)
cp.add_data_validation(dv)
for i, e in enumerate(evidence):
    r = 25 + i
    put(cp, f"A{r}", e, "label")
    put(cp, f"B{r}", None, "input")
    dv.add(f"B{r}")
section(cp, "A32", "ניתוח שורש (אישיקאווה)")
header(cp, 32, ["תחום", "ממצא", "הערכה", "ראיה"])
dv2 = DataValidation(type="list", formula1='"נשלל,אפשרי,סביר"', allow_blank=True)
cp.add_data_validation(dv2)
for i, cat in enumerate(["חומרי גלם", "תכן התערובת", "ייצור במפעל", "הובלה", "ביצוע באתר", "אשפרה", "דגימה ובדיקה"]):
    r = 33 + i
    put(cp, f"A{r}", cat, "label")
    for col in "BCD":
        put(cp, f"{col}{r}", None, "input")
    dv2.add(f"C{r}")
section(cp, "A41", "החלטה")
for i, f in enumerate(["גורם השורש", "אחריות (מפעל / אתר / משותפת)", "פתרון ללקוח", "פעולה מתקנת במפעל",
                       "אחראי ותאריך יעד", "לקח לשיתוף בין המפעלים"]):
    r = 42 + i
    put(cp, f"A{r}", f, "label")
    cp.merge_cells(f"B{r}:E{r}")
    put(cp, f"B{r}", None, "input")

ORDER = ["הוראות", "תכן תערובת", "תיקון לחות", "תערובות ניסיון", "אבחון ותיקון", "עלות ותרחישים",
         "בקרה סטטיסטית", "טמפרטורת בטון", "תיק תלונה"]
wb._sheets = [wb[n] for n in ORDER]
wb.save(OUT)
print("saved", OUT, wb.sheetnames)
