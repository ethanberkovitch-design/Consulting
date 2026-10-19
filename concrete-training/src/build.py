"""Builds the "תורת הבטון" training deck on top of the corporate template.

Usage: python3 build.py <template.pptx> <assets_dir> <out.pptx>
The template's master (logo, line, slide number, title style) is kept as is; the
cover, section-divider and thank-you slides are cloned from the template's samples.
"""
import copy
import json
import re
import sys

from lxml import etree
from PIL import Image
from pptx import Presentation
from pptx.chart.data import CategoryChartData, XyChartData
from pptx.dml.color import RGBColor
from pptx.enum.chart import XL_CHART_TYPE, XL_LABEL_POSITION, XL_LEGEND_POSITION, XL_MARKER_STYLE
from pptx.enum.shapes import MSO_CONNECTOR, MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Emu, Inches, Pt

TEMPLATE, ASSETS, OUT = sys.argv[1:4]

FONT = "Arial Unicode MS"  # mandated by the template
NAVY, BLUE, TITLE_BLUE, LIME, LIME_D = "003973", "0081C8", "0070C0", "C4D82E", "7E8F12"
GRAY, TEXT, MUTED, WHITE = "A3B1BA", "333F4A", "5F6B76", "FFFFFF"
TINT, TINT2, LIME_T = "EAF3FA", "F3F5F7", "F3F7D9"
RED, RED_T, GREEN, GREEN_T, AMBER, AMBER_T = "C62828", "FBE9E9", "2E7D32", "E8F3E9", "B26A00", "FFF2DC"
FOOTER = "סולל בונה תעשיות | אקדמיית טכנולוגיה ואיכות"

prs = Presentation(TEMPLATE)
TPL = list(prs.slides)  # 0 cover, 6 divider, 7 thanks
L_TITLE_ONLY = prs.slide_layouts[5]


def I(v):
    return Emu(int(v * 914400))


def rgb(h):
    return RGBColor.from_string(h)


RANGE = re.compile(r"(\d+(?:\.\d+)?)%-(\d+(?:\.\d+)?)%")


def bidi(t):
    """'70%-80%' flips to '80%-70%' inside RTL text; '70-80%' stays one LTR run."""
    return RANGE.sub(r"\1-\2%", t)


def rl(t):
    """Chart text is laid out LTR; a leading RLM keeps Hebrew labels in reading order."""
    return "\u200F" + t


# ---------------------------------------------------------------- primitives
def set_font(run, size=None, color=None, bold=None, italic=None):
    rPr = run._r.get_or_add_rPr()
    for tag in ("a:latin", "a:ea", "a:cs"):
        el = rPr.find(qn(tag))
        if el is None:
            el = etree.SubElement(rPr, qn(tag))
        el.set("typeface", FONT)
    rPr.set("lang", "he-IL")
    if size:
        run.font.size = Pt(size)
    if color:
        run.font.color.rgb = rgb(color)
    if bold is not None:
        run.font.bold = bold
    if italic is not None:
        run.font.italic = italic


def _para_fmt(p, align, rtl=True, bullet=False, space_after=0, line=None, level_indent=0.25):
    pPr = p._p.get_or_add_pPr()
    pPr.set("algn", {"r": "r", "l": "l", "c": "ctr", "j": "just"}[align])
    pPr.set("rtl", "1" if rtl else "0")
    for tag in ("a:buNone", "a:buChar", "a:buFont"):
        for el in pPr.findall(qn(tag)):
            pPr.remove(el)
    if bullet:
        pPr.set("marL", str(int(level_indent * 914400)))
        pPr.set("indent", str(int(-level_indent * 914400)))
        bf = etree.SubElement(pPr, qn("a:buFont"))
        bf.set("typeface", "Arial")
        bc = etree.SubElement(pPr, qn("a:buChar"))
        bc.set("char", "•")
    else:
        pPr.set("marL", "0")
        pPr.set("indent", "0")
        etree.SubElement(pPr, qn("a:buNone"))
    if space_after:
        p.space_after = Pt(space_after)
    if line:
        p.line_spacing = line


def text(s, x, y, w, h, content, size=16, color=TEXT, bold=False, align="r", anchor="t",
         bullet=False, space_after=4, line=None, rtl=True, name=None):
    """content: str | list of paragraphs; paragraph: str | list of (text, opts) runs | dict."""
    tb = s.shapes.add_textbox(I(x), I(y), I(w), I(h))
    if name:
        tb.name = name
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = {"t": MSO_ANCHOR.TOP, "m": MSO_ANCHOR.MIDDLE, "b": MSO_ANCHOR.BOTTOM}[anchor]
    tb.text_frame._txBody.bodyPr.set("rtlCol", "1" if rtl else "0")
    paras = content if isinstance(content, list) else [content]
    for i, para in enumerate(paras):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        opts = {}
        if isinstance(para, dict):
            opts = para
            para = para["t"]
        runs = para if isinstance(para, list) else [(para, {})]
        _para_fmt(p, opts.get("align", align), opts.get("rtl", rtl), opts.get("bullet", bullet),
                  opts.get("space_after", space_after), opts.get("line", line))
        for rt, ro in runs:
            r = p.add_run()
            r.text = bidi(rt)
            set_font(r, ro.get("size", opts.get("size", size)), ro.get("color", opts.get("color", color)),
                     ro.get("bold", opts.get("bold", bold)), ro.get("italic"))
    return tb


def _strip_style(shape):
    st = shape._element.find(qn("p:style"))
    if st is not None:
        shape._element.remove(st)


def box(s, x, y, w, h, fill=TINT, line=None, lw=1.0, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.08,
        name=None, rotation=0):
    sh = s.shapes.add_shape(shape, I(x), I(y), I(w), I(h))
    _strip_style(sh)
    if fill:
        sh.fill.solid()
        sh.fill.fore_color.rgb = rgb(fill)
    else:
        sh.fill.background()
    if line:
        sh.line.color.rgb = rgb(line)
        sh.line.width = Pt(lw)
    else:
        sh.line.fill.background()
    if shape == MSO_SHAPE.ROUNDED_RECTANGLE:
        sh.adjustments[0] = radius
    if rotation:
        sh.rotation = rotation
    if name:
        sh.name = name
    return sh


def shape_text(sh, content, size=16, color=WHITE, bold=True, align="c", anchor="m", margin=0.05):
    tf = sh.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = I(margin)
    tf.margin_top = tf.margin_bottom = I(0.02)
    tf.vertical_anchor = {"t": MSO_ANCHOR.TOP, "m": MSO_ANCHOR.MIDDLE, "b": MSO_ANCHOR.BOTTOM}[anchor]
    paras = content if isinstance(content, list) else [content]
    for i, para in enumerate(paras):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        _para_fmt(p, align)
        runs = para if isinstance(para, list) else [(para, {})]
        for rt, ro in runs:
            r = p.add_run()
            r.text = bidi(rt)
            set_font(r, ro.get("size", size), ro.get("color", color), ro.get("bold", bold))
    return sh


def line(s, x1, y1, x2, y2, color=BLUE, w=2.0, head=True, dash=False, tail=False):
    c = s.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, I(x1), I(y1), I(x2), I(y2))
    _strip_style(c)
    c.line.color.rgb = rgb(color)
    c.line.width = Pt(w)
    ln = c.line._get_or_add_ln()
    if dash:
        pd = etree.SubElement(ln, qn("a:prstDash"))
        pd.set("val", "dash")
    if tail:
        e = etree.SubElement(ln, qn("a:headEnd"))
        e.set("type", "triangle")
    if head:
        e = etree.SubElement(ln, qn("a:tailEnd"))
        e.set("type", "triangle")
    return c


def pic(s, name, x, y, w=None, h=None):
    path = f"{ASSETS}/{name}.png"
    iw, ih = Image.open(path).size
    if w and not h:
        h = w * ih / iw
    elif h and not w:
        w = h * iw / ih
    return s.shapes.add_picture(path, I(x), I(y), I(w), I(h))


def fit(name, x, y, w, h):
    """Largest size of an asset that fits the box, centred in it."""
    iw, ih = Image.open(f"{ASSETS}/{name}.png").size
    sc = min(w / iw, h / ih)
    ww, hh = iw * sc, ih * sc
    return x + (w - ww) / 2, y + (h - hh) / 2, ww, hh


def pic_fit(s, name, x, y, w, h):
    fx, fy, fw, fh = fit(name, x, y, w, h)
    return pic(s, name, fx, fy, fw, fh)


def icon(s, name, cx, cy, d, fill=BLUE, color="w", ring=None):
    c = box(s, cx - d / 2, cy - d / 2, d, d, fill=fill, shape=MSO_SHAPE.OVAL, line=ring, lw=2.5)
    g = d * 0.52
    pic(s, f"{name}_{color}", cx - g / 2, cy - g / 2, g, g)
    return c


def glyph(s, name, x, y, d, color="b"):
    return pic(s, f"{name}_{color}", x, y, d, d)


def badge(s, n, cx, cy, d=0.5, fill=NAVY, color=WHITE, size=16):
    b = box(s, cx - d / 2, cy - d / 2, d, d, fill=fill, shape=MSO_SHAPE.OVAL)
    shape_text(b, str(n), size=size, color=color, margin=0)
    return b


def card(s, x, y, w, h, title, body, ic=None, fill=TINT, tsize=18, bsize=15, title_color=NAVY,
         icon_fill=BLUE, bullet=False):
    box(s, x, y, w, h, fill=fill)
    pad = 0.2
    tx_w = w - 2 * pad
    ty = y + pad
    if ic:
        icon(s, ic, x + w - pad - 0.3, y + pad + 0.3, 0.6, fill=icon_fill)
        text(s, x + pad, ty + 0.08, tx_w - 0.75, 0.5, title, size=tsize, color=title_color, bold=True, anchor="m")
        ty += 0.75
    else:
        text(s, x + pad, ty, tx_w, 0.45, title, size=tsize, color=title_color, bold=True)
        ty += 0.5
    if body:
        text(s, x + pad, ty, tx_w, y + h - ty - pad, body, size=bsize, color=TEXT, bullet=bullet, space_after=3)


def message(s, content, y=5.78, x=0.9, w=8.95, h=0.7, ic="FaLightbulb"):
    """Key-message strip; kept clear of the template's logo at the bottom right."""
    box(s, x, y, w, h, fill=NAVY)
    icon(s, ic, x + w - 0.42, y + h / 2, 0.5, fill=LIME, color="n")
    text(s, x + 0.25, y, w - 1.0, h, content, size=17, color=WHITE, bold=True, anchor="m")


def table(s, x, y, w, rows, colw, size=13, header_fill=BLUE, row_h=0.42, header_h=0.5,
          zebra=(WHITE, TINT2), align=None, bold_first=True, cell_fill=None, header_size=None):
    """rows[0] is the header; columns are given right-to-left (logical RTL order)."""
    n, m = len(rows), len(rows[0])
    rows_ltr = [list(reversed(r)) for r in rows]
    colw_ltr = list(reversed(colw))
    align_ltr = list(reversed(align)) if align else ["r"] * m
    total_h = header_h + row_h * (n - 1)
    gf = s.shapes.add_table(n, m, I(x), I(y), I(w), I(total_h))
    tbl = gf.table
    tbl.first_row = True
    tbl.horz_banding = False
    scale = w / sum(colw_ltr)
    for j, cw in enumerate(colw_ltr):
        tbl.columns[j].width = I(cw * scale)
    for i in range(n):
        tbl.rows[i].height = I(header_h if i == 0 else row_h)
        for j in range(m):
            c = tbl.cell(i, j)
            c.margin_left = c.margin_right = I(0.08)
            c.margin_top = c.margin_bottom = I(0.04)
            c.vertical_anchor = MSO_ANCHOR.MIDDLE
            fill = header_fill if i == 0 else zebra[(i - 1) % 2]
            if cell_fill and i > 0:
                fill = cell_fill(i, m - 1 - j) or fill
            c.fill.solid()
            c.fill.fore_color.rgb = rgb(fill)
            val = rows_ltr[i][j]
            tf = c.text_frame
            tf.word_wrap = True
            p = tf.paragraphs[0]
            _para_fmt(p, "c" if i == 0 else align_ltr[j])
            r = p.add_run()
            r.text = bidi(str(val))
            is_first = (m - 1 - j) == 0
            set_font(r, (header_size or size) if i == 0 else size, WHITE if i == 0 else TEXT,
                     i == 0 or (bold_first and is_first))
    return gf


def style_chart(ch, size=12):
    ch.font.size = Pt(size)
    ch.font.name = FONT
    ch.font.color.rgb = rgb(TEXT)


def axis_fmt(ax, title=None, size=12, gridlines=True, fmt=None):
    ax.has_major_gridlines = gridlines
    if gridlines:
        ax.major_gridlines.format.line.color.rgb = rgb("DDE3E8")
        ax.major_gridlines.format.line.width = Pt(0.75)
    ax.format.line.color.rgb = rgb("B8C2CA")
    ax.tick_labels.font.size = Pt(size)
    ax.tick_labels.font.name = FONT
    ax.tick_labels.font.color.rgb = rgb(MUTED)
    if fmt:
        ax.tick_labels.number_format = fmt
        ax.tick_labels.number_format_is_linked = False
    if title:
        ax.has_title = True
        ax.axis_title.text_frame.text = title
        for p in ax.axis_title.text_frame.paragraphs:
            for r in p.runs:
                set_font(r, size, MUTED, False)


def series_line(ser, color, w=2.75, marker=True, dash=False, smooth=False):
    ser.format.line.color.rgb = rgb(color)
    ser.format.line.width = Pt(w)
    ser.smooth = smooth
    if dash:
        ln = ser.format.line._get_or_add_ln()
        pd = etree.SubElement(ln, qn("a:prstDash"))
        pd.set("val", "dash")
    if marker:
        ser.marker.style = XL_MARKER_STYLE.CIRCLE
        ser.marker.size = 7
        ser.marker.format.fill.solid()
        ser.marker.format.fill.fore_color.rgb = rgb(color)
        ser.marker.format.line.color.rgb = rgb(WHITE)
    else:
        ser.marker.style = XL_MARKER_STYLE.NONE


def caption(s, x, y, w, t, align="r"):
    text(s, x, y, w, 0.3, t, size=11, color=MUTED, align=align)


# ---------------------------------------------------------------- slide factories
SECTION_LOG = []


def content_slide(title):
    s = prs.slides.add_slide(L_TITLE_ONLY)
    s.shapes.title.text = title
    for p in s.shapes.title.text_frame.paragraphs:
        for r in p.runs:
            set_font(r)
    return s


def clone(src):
    s = prs.slides.add_slide(src.slide_layout)
    for shp in list(s.shapes):
        shp._element.getparent().remove(shp._element)
    rid_map = {}
    for rid, rel in src.part.rels.items():
        if rel.reltype.endswith("/image"):
            rid_map[rid] = s.part.relate_to(rel._target, rel.reltype)
    tree = s.shapes._spTree
    for el in src.shapes._spTree.iterchildren():
        if el.tag in (qn("p:nvGrpSpPr"), qn("p:grpSpPr")):
            continue
        new = copy.deepcopy(el)
        for node in new.iter():
            for attr in (qn("r:embed"), qn("r:id"), qn("r:link")):
                if node.get(attr) in rid_map:
                    node.set(attr, rid_map[node.get(attr)])
        tree.append(new)
    return s


def find(s, name):
    return next(sh for sh in s.shapes if sh.name == name)


def retext(sh, content, size=None, color=None, align=None, wrap=True):
    """Replace a cloned text box's text, keeping its first run's formatting."""
    tf = sh.text_frame
    first_p = tf.paragraphs[0]._p
    rpr = copy.deepcopy(first_p.find(qn("a:r")).find(qn("a:rPr")))
    ppr = first_p.find(qn("a:pPr"))
    ppr = copy.deepcopy(ppr) if ppr is not None else None
    body = tf._txBody
    for p in body.findall(qn("a:p")):
        body.remove(p)
    for line_ in content if isinstance(content, list) else [content]:
        p = etree.SubElement(body, qn("a:p"))
        if ppr is not None:
            p.append(copy.deepcopy(ppr))
        r = etree.SubElement(p, qn("a:r"))
        rp = copy.deepcopy(rpr)
        if size:
            rp.set("sz", str(int(size * 100)))
        r.append(rp)
        t = etree.SubElement(r, qn("a:t"))
        t.text = line_
    bp = body.find(qn("a:bodyPr"))
    if wrap:
        bp.set("wrap", "square")
        for el in list(bp):
            if el.tag in (qn("a:spAutoFit"), qn("a:normAutofit")):
                bp.remove(el)
    for p in tf.paragraphs:
        pPr = p._p.get_or_add_pPr()
        if align:
            pPr.set("algn", align)
        pPr.set("rtl", "1")
        if color:
            for r in p.runs:
                r.font.color.rgb = rgb(color)


def divider(num, title, topics):
    s = clone(TPL[6])
    tb = find(s, "TextBox 7")
    tb.left, tb.top, tb.width, tb.height = I(7.35), I(2.75), I(5.4), I(1.0)
    retext(tb, title, size=36, align="ctr")
    tb.text_frame.vertical_anchor = MSO_ANCHOR.MIDDLE
    text(s, 7.35, 2.05, 5.4, 0.5, f"פרק {num}" if num else "", size=20, color=WHITE, align="c")
    text(s, 7.75, 3.95, 4.6, 2.2, " · ".join(topics), size=16, color=WHITE, align="c", line=1.15)
    return s


# ---------------------------------------------------------------- footer on the content layout
def add_layout_footer():
    tmp = prs.slides.add_slide(L_TITLE_ONLY)
    tb = text(tmp, 0.95, 6.82, 4.4, 0.3, FOOTER, size=10, color=MUTED, align="l", name="Footer academy")
    el = tb._element
    L_TITLE_ONLY.shapes._spTree.append(el)
    # drop the temporary slide
    sldIdLst = prs.slides._sldIdLst
    rid = sldIdLst[-1].get(qn("r:id"))
    prs.part.drop_rel(rid)
    sldIdLst.remove(sldIdLst[-1])


add_layout_footer()

# ================================================================ 1. Cover
s = clone(TPL[0])
t = find(s, "TextBox 4")
t.left, t.top, t.width, t.height = I(1.67), I(3.78), I(10.0), I(0.8)
retext(t, "תורת הבטון", size=40, align="ctr")
d = find(s, "מציין מיקום תוכן 2")
d.left, d.width = I(0.32), I(2.6)
retext(d, "אוקטובר 2026", size=12)
for p in d.text_frame.paragraphs:
    _para_fmt(p, "l")
    for r in p.runs:
        set_font(r, 12, MUTED)
text(s, 1.67, 4.6, 10.0, 0.45, "יסודות, איכות ומצוינות מקצועית", size=22, color=NAVY, align="c")
text(s, 1.67, 5.06, 10.0, 0.35, "Concrete Technology Fundamentals  |  אקדמיית טכנולוגיה ואיכות", size=13,
     color=MUTED, align="c")
pic(s, "skyline", 2.05, 5.55, w=9.2)

# ================================================================ 2. Objectives
s = content_slide("מטרות ההדרכה")
cx, cy = 3.1, 3.55
for d_, col in ((4.3, "DCE6F1"), (3.3, "A9C6E3"), (2.3, BLUE), (1.2, NAVY)):
    box(s, cx - d_ / 2, cy - d_ / 2, d_, d_, fill=col, shape=MSO_SHAPE.OVAL)
pic(s, "FaBullseye_w", cx - 0.32, cy - 0.32, 0.64, 0.64)
line(s, 5.6, 1.65, cx + 0.25, cy - 0.2, color=LIME_D, w=4)
text(s, 0.9, 5.95, 4.4, 0.6, "מטרה: משתתף שמבין את החומר — ומונע כשלים לפני שהם קורים", size=14,
     color=MUTED, align="c")
objs = [
    ("FaFlask", "להבין כיצד נוצר בטון", "מרכיבים, הידרציה ומבנה"),
    ("FaCogs", "להבין את גורמי האיכות", "W/C, חומרי גלם, אשפרה"),
    ("FaExclamationTriangle", "לזהות כשלים", "סגרגציה, דימום, קיני חצץ, סדיקה"),
    ("FaClipboardCheck", "לבצע בקרת איכות", "בדיקות טרי, קשוח וחומרי גלם"),
    ("FaBook", "להכיר תקנים ודרישות", "ת\"י, EN ו-ASTM"),
]
for i, (ic, t1, t2) in enumerate(objs):
    y = 1.2 + i * 0.98
    icon(s, ic, 12.2, y + 0.4, 0.7)
    text(s, 6.2, y + 0.02, 5.5, 0.42, t1, size=19, color=NAVY, bold=True)
    text(s, 6.2, y + 0.45, 5.5, 0.35, t2, size=15, color=MUTED)

# ================================================================ 3. Value chain
s = content_slide("שרשרת הערך של הבטון")
chain = [
    ("FaMountain", "מחצבה", "סוג הסלע וניקיונו"),
    ("FaFilter", "מפעל אגרגטים", "גריסה, ניפוי, שטיפה"),
    ("FaWarehouse", "צמנט", "סוג, חוזק, אחידות"),
    ("FaIndustry", "מפעל בטון", "תכן תערובת, שקילה, ערבוב"),
    ("FaTruck", "הובלה", "זמן, טמפרטורה, ללא תוספת מים"),
    ("FaHardHat", "אתר", "יציקה, ריטוט, אשפרה"),
    ("FaBuilding", "לקוח", "מבנה עמיד לעשרות שנים"),
]
step_w, gap = 1.45, 0.25
x0 = 12.55 - step_w
for i, (ic, t1, t2) in enumerate(chain):
    x = x0 - i * (step_w + gap)
    fill = NAVY if i in (3,) else BLUE
    icon(s, ic, x + step_w / 2, 1.95, 1.0, fill=fill)
    text(s, x - 0.05, 2.6, step_w + 0.1, 0.42, t1, size=17, color=NAVY, bold=True, align="c")
    text(s, x - 0.05, 3.02, step_w + 0.1, 0.8, t2, size=13, color=MUTED, align="c")
    if i < len(chain) - 1:
        line(s, x - 0.02, 1.95, x - gap + 0.02, 1.95, color=GRAY, w=2.5)
box(s, 0.9, 4.05, 11.65, 1.45, fill=TINT2)
pts = [("FaSearch", "כל חוליה משפיעה", "אגרגט מלוכלך במחצבה = בעיית חוזק ועבידות במפעל"),
       ("FaLink", "האחריות משותפת", "מספק חומרי הגלם ועד הצוות שמאשפר באתר"),
       ("FaChartLine", "בקרה לאורך השרשרת", "בדיקה בכל מעבר — לא רק בקוביות של 28 יום")]
for i, (ic, t1, t2) in enumerate(pts):
    x = 8.75 - i * 3.9
    icon(s, ic, x + 3.45, 4.5, 0.5, fill=NAVY)
    text(s, x, 4.3, 3.1, 0.4, t1, size=16, color=NAVY, bold=True)
    text(s, x, 4.7, 3.1, 0.75, t2, size=13, color=TEXT)
message(s, "איכות הבטון נקבעת לאורך כל שרשרת הערך — חוליה חלשה אחת מספיקה לכשל")

# ================================================================ Section 1
divider(1, "מרכיבי הבטון", ["אגרגטים", "צמנט", "מים", "מוספים ותוספים"])

# ---------------------------------------------------------------- 4. What is concrete
s = content_slide("מהו בטון?")
text(s, 5.6, 1.15, 6.95, 0.75, "חומר מרוכב: שלד של אגרגטים שמשחת צמנט ומים מלכדת לגוף אחד מוצק",
     size=17, color=MUTED)
cd = CategoryChartData()
parts = [("אגרגט גס", 42, NAVY), ("אגרגט דק", 28, BLUE), ("מים", 17, "7FC3EA"), ("צמנט", 11, GRAY),
         ("אוויר", 2, LIME)]
cd.categories = [p[0] for p in parts]
cd.add_series("נפח", [p[1] for p in parts])
gf = s.shapes.add_chart(XL_CHART_TYPE.DOUGHNUT, I(0.9), I(1.15), I(4.6), I(4.2), cd)
ch = gf.chart
style_chart(ch, 13)
ch.has_legend = False
ch.has_title = False
plot = ch.plots[0]
for i, p in enumerate(parts):
    pt = plot.series[0].points[i]
    pt.format.fill.solid()
    pt.format.fill.fore_color.rgb = rgb(p[2])
    pt.format.line.color.rgb = rgb(WHITE)
plot.has_data_labels = True
dl = plot.data_labels
dl.number_format = '0"%"'
dl.number_format_is_linked = False
dl.font.size = Pt(13)
dl.font.bold = True
dl.font.color.rgb = rgb(WHITE)
hole = ch._chartSpace.find(".//" + qn("c:holeSize"))
if hole is not None:
    hole.set("val", "55")
text(s, 2.15, 2.85, 2.1, 0.7, [{"t": "כ-70%", "size": 26, "bold": True, "color": NAVY},
                              {"t": "אגרגטים", "size": 14, "color": MUTED}], align="c")
caption(s, 0.9, 5.35, 4.6, "חלוקת נפח טיפוסית בבטון רגיל (להמחשה)", align="c")
comps = [
    ("FaCubes", NAVY, "אגרגטים", "חצץ וחול — השלד הנושא של הבטון"),
    ("FaWarehouse", GRAY, "צמנט", "החומר הקושר: מגיב עם מים ויוצר את הדבק"),
    ("FaTint", "7FC3EA", "מים", "מניעים את ההידרציה ומעניקים עבידות"),
    ("FaVial", BLUE, "מוספים", "כימיקלים במינון נמוך שמשנים התנהגות"),
    ("FaRecycle", LIME, "תוספים", "חומרים מינרליים פעילים במקום חלק מהצמנט"),
]
for i, (ic, col, t1, t2) in enumerate(comps):
    y = 1.95 + i * 0.72
    icon(s, ic, 12.2, y + 0.3, 0.58, fill=col, color="n" if col in (LIME, "7FC3EA", GRAY) else "w")
    text(s, 5.9, y + 0.02, 5.85, 0.6, [[(t1 + "  ", {"bold": True, "color": NAVY, "size": 17}),
                                        (t2, {"size": 15})]], anchor="m")
message(s, "בטון טוב = חומרי גלם טובים × תכן נכון × ביצוע נכון", y=5.8, h=0.62)

# ---------------------------------------------------------------- 5. Aggregates
s = content_slide("תפקיד האגרגטים")
pic_fit(s, "aggregates", 0.9, 1.2, 6.6, 4.55)
caption(s, 0.9, 5.8, 6.6, "חתך בטון: האגרגטים (מסומנים) הם רוב הנפח, ומשחת הצמנט ממלאת את החללים", align="c")
text(s, 7.9, 1.15, 4.65, 1.2, [{"t": "70%-80%", "size": 54, "bold": True, "color": BLUE},
                               {"t": "מנפח הבטון", "size": 18, "color": MUTED}], align="r")
pts = [("FaWeightHanging", "שלד נושא", "תורמים לחוזק ולמודול האלסטיות; אגרגט חזק ונקי = בטון חזק"),
       ("FaShieldAlt", "עמידות ויציבות נפחית", "מקטינים התכווצות, זחילה וחום הידרציה"),
       ("FaCoins", "כלכליות", "זולים מהצמנט — גרדציה טובה חוסכת משחה")]
for i, (ic, t1, t2) in enumerate(pts):
    y = 2.6 + i * 1.08
    icon(s, ic, 12.25, y + 0.33, 0.6)
    text(s, 7.9, y, 3.95, 0.38, t1, size=18, color=NAVY, bold=True)
    text(s, 7.9, y + 0.4, 3.95, 0.65, t2, size=14)

# ---------------------------------------------------------------- 6. Cement
s = content_slide("תפקיד הצמנט")
pic_fit(s, "hydration", 0.9, 1.35, 7.4, 2.4)
for i, (t1, t2) in enumerate([("גרגרי צמנט במים", "דקות 0"), ("תחילת הידרציה", "שעות"), ("רשת C-S-H מלכדת", "ימים")]):
    x = 0.9 + i * 2.53
    text(s, x, 3.85, 2.3, 0.35, t1, size=15, color=NAVY, bold=True, align="c")
    text(s, x, 4.2, 2.3, 0.3, t2, size=13, color=MUTED, align="c")
box(s, 0.9, 4.75, 7.4, 0.85, fill=TINT2)
text(s, 1.1, 4.8, 7.0, 0.75, [[("מרכיבי הקלינקר:  ", {"bold": True, "color": NAVY}), ("C₃S, C₂S, C₃A, C₄AF", {})],
                              [("סוגי צמנט:  ", {"bold": True, "color": NAVY}), ("CEM I עד CEM V, לפי ת\"י 1", {})]],
     size=14, anchor="m", space_after=2)
pts = [("FaLink", "החומר הקושר", "המרכיב היחיד שהופך את התערובת לגוף מוצק"),
       ("FaLayerGroup", "יוצר את משחת הצמנט", "צמנט + מים עוטפים את האגרגטים וממלאים חללים"),
       ("FaChartLine", "מפתח חוזק", "התגובה נמשכת שבועות וחודשים כל עוד יש לחות")]
for i, (ic, t1, t2) in enumerate(pts):
    y = 1.3 + i * 1.2
    icon(s, ic, 12.25, y + 0.35, 0.62)
    text(s, 8.7, y, 3.15, 0.4, t1, size=18, color=NAVY, bold=True)
    text(s, 8.7, y + 0.42, 3.15, 0.75, t2, size=14)
message(s, "צמנט אינו \"דבק\" שמתייבש — הוא מגיב כימית עם מים ומתקשה", y=5.85, h=0.62)

# ---------------------------------------------------------------- 7. Water
s = content_slide("תפקיד המים")
text(s, 0.9, 1.2, 7.5, 0.4, "יחס מים-צמנט (W/C) — סקאלת השפעה", size=17, color=NAVY, bold=True)
zones = [(0.30, 0.40, NAVY, "חוזק גבוה מאוד", "דורש סופר-פלסטיצייזר"),
         (0.40, 0.50, BLUE, "בטון מבני איכותי", "עמידות טובה"),
         (0.50, 0.60, "7FC3EA", "בטון רגיל", "רגיש לאשפרה"),
         (0.60, 0.75, GRAY, "בטון חלש וחדיר", "סיכון לעמידות")]
sx, sw = 0.9, 7.5
lo, hi = 0.30, 0.75
for a, b_, col, t1, t2 in zones:
    # higher W/C to the left so the scale reads right-to-left like the slide
    x = sx + (hi - b_) / (hi - lo) * sw
    w = (b_ - a) / (hi - lo) * sw
    r = box(s, x, 1.8, w - 0.04, 0.65, fill=col, shape=MSO_SHAPE.RECTANGLE)
    shape_text(r, t1, size=13, color=WHITE if col in (NAVY, BLUE) else NAVY)
    text(s, x, 2.5, w - 0.04, 0.3, t2, size=12, color=MUTED, align="c")
for v in (0.30, 0.40, 0.50, 0.60, 0.75):
    x = sx + (hi - v) / (hi - lo) * sw
    text(s, x - 0.3, 2.85, 0.6, 0.3, f"{v:.2f}", size=13, color=TEXT, align="c", rtl=False)
line(s, sx + 7.3, 3.35, sx + 0.2, 3.35, color=MUTED, w=1.5)
text(s, sx, 3.42, sw, 0.3, "חוזק ועמידות יורדים  ←  יותר מים", size=13, color=MUTED, align="c")
box(s, 0.9, 4.0, 3.6, 1.55, fill=TINT)
text(s, 1.05, 4.08, 3.3, 1.45, [{"t": "0.25", "size": 32, "bold": True, "color": BLUE},
                                {"t": "W/C שנדרש כימית להידרציה מלאה (בקירוב)", "size": 14}], align="c")
box(s, 4.8, 4.0, 3.6, 1.55, fill=TINT)
text(s, 4.95, 4.08, 3.3, 1.45, [{"t": "0.45-0.55", "size": 32, "bold": True, "color": NAVY},
                                {"t": "W/C טיפוסי בבטון מבני — העודף הוא \"מי עבידות\"", "size": 14}], align="c")
pts = [("FaFlask", "יצירת הידרציה", "המים מגיבים עם הצמנט ויוצרים את מוצרי ההידרציה"),
       ("FaHandPaper", "השפעה על עבידות", "מאפשרים שאיבה, יציקה וריטוט"),
       ("FaArrowDown", "השפעה על חוזק", "כל ליטר עודף משאיר נקבוביות ומחליש")]
for i, (ic, t1, t2) in enumerate(pts):
    y = 1.3 + i * 1.3
    icon(s, ic, 12.25, y + 0.35, 0.62)
    text(s, 8.8, y, 3.05, 0.4, t1, size=18, color=NAVY, bold=True)
    text(s, 8.8, y + 0.42, 3.05, 0.85, t2, size=14)
message(s, "המים הנוספים מעבר לנדרש כימית — הם שמשאירים את הנקבוביות", y=5.85, h=0.62)

# ---------------------------------------------------------------- 8. Admixtures vs additions
s = content_slide("מוספים ותוספים")
box(s, 6.85, 1.15, 5.7, 0.8, fill=TINT)
icon(s, "FaVial", 12.15, 1.55, 0.55)
text(s, 7.0, 1.2, 4.75, 0.7, [[("מוספים (Admixtures): ", {"bold": True, "color": NAVY}),
                               ("כימיקלים, מינון קטן מ-5% ממשקל הצמנט", {})]], size=14, anchor="m")
box(s, 0.9, 1.15, 5.7, 0.8, fill=LIME_T)
icon(s, "FaRecycle", 6.2, 1.55, 0.55, fill=LIME, color="n")
text(s, 1.05, 1.2, 4.75, 0.7, [[("תוספים (Additions): ", {"bold": True, "color": NAVY}),
                               ("חומרים מינרליים פעילים, מחליפים חלק מהצמנט", {})]], size=14, anchor="m")
rows = [["סוג", "חומר", "פעולה עיקרית", "מתי משתמשים"],
        ["מוסף", "סופר-פלסטיצייזר", "מפזר את גרגרי הצמנט; מפחית מים ב-12%-30%", "חוזק גבוה, בטון זורם, W/C נמוך"],
        ["מוסף", "מעכב", "דוחה את תחילת ההתקשרות", "קיץ, הובלה ארוכה, יציקות רציפות"],
        ["מוסף", "מאיץ", "מזרז התקשרות והתפתחות חוזק מוקדם", "חורף, טרום, פירוק תבניות מוקדם"],
        ["תוסף", "אפר פחם (Fly Ash)", "תגובה פוצולנית; עבידות ועמידות", "יציקות מסיביות, עמידות לכלורידים"],
        ["תוסף", "מיקרוסיליקה", "חלקיקים זעירים שממלאים חללים", "בטון בחוזק גבוה, סביבה ימית"],
        ["תוסף", "סיגים (GGBS)", "חום הידרציה נמוך, עמידות כימית", "מבנים ימיים, סולפטים, מסיבי"]]
table(s, 0.9, 2.15, 11.65, rows, [1.0, 2.2, 4.4, 4.05], size=13, row_h=0.52,
      cell_fill=lambda i, j: (TINT if i <= 3 else LIME_T) if j == 0 else None)

# ================================================================ Section 2
divider(2, "הידרציה ומבנה", ["תהליך ההידרציה", "מיקרו-מבנה", "גורמים משפיעים", "התפתחות המבנה"])

# ---------------------------------------------------------------- 9. Hydration
s = content_slide("מהי הידרציה?")
steps = [("FaTint", "מים + צמנט", "מגע ראשוני, תחילת פירוק המינרלים"),
         ("FaBolt", "תגובה כימית", "אקסותרמית — משחררת חום"),
         ("FaLayerGroup", "C-S-H", "סיליקט סידן מוהדר: \"הדבק\" של הבטון"),
         ("FaChartLine", "התפתחות חוזק", "הרשת מתעבה והחללים מתמלאים")]
for i, (ic, t1, t2) in enumerate(steps):
    x = 9.75 - i * 2.95
    box(s, x, 1.3, 2.75, 2.7, fill=NAVY if i == 2 else TINT)
    icon(s, ic, x + 1.375, 1.95, 0.85, fill=LIME if i == 2 else BLUE, color="n" if i == 2 else "w")
    text(s, x + 0.15, 2.55, 2.45, 0.45, t1, size=20, bold=True, color=WHITE if i == 2 else NAVY, align="c")
    text(s, x + 0.15, 3.05, 2.45, 0.85, t2, size=14, color=WHITE if i == 2 else TEXT, align="c")
    if i < 3:
        line(s, x - 0.02, 2.65, x - 0.18, 2.65, color=BLUE, w=3)
box(s, 0.9, 4.3, 11.65, 1.2, fill=TINT2)
text(s, 1.1, 4.35, 5.5, 1.1, [{"t": "C₃S / C₂S + H₂O  →  C-S-H + CH", "size": 22, "bold": True, "color": NAVY,
                               "align": "c"},
                              {"t": "תוצר משני: סידן הידרוקסידי — שומר על pH גבוה ומגן על הזיון", "size": 13,
                               "align": "c"}], anchor="m", rtl=True)
text(s, 6.9, 4.4, 5.45, 1.05, [{"t": "50%-60% מנפח המשחה המוקשה הוא C-S-H", "bullet": True},
                               {"t": "ההידרציה צורכת מים — בלי לחות היא נעצרת", "bullet": True}], size=15)
message(s, "אין הידרציה — אין חוזק. לכן האשפרה היא חלק מהתהליך, לא תוספת", y=5.8, h=0.65)

# ---------------------------------------------------------------- 10. Microstructure
s = content_slide("מיקרו-מבנה של בטון")
anch = json.load(open(f"{ASSETS}/micro_anchors.json"))
mx, my, mw = 0.9, 1.15, 7.4
scale = mw / 1000
pic(s, "micro", mx, my, w=mw)
labels = [("אגרגט", "Aggregate", "השלד: חזק וצפוף"),
          ("ITZ — אזור המגע", "Interfacial Transition Zone", "10-50 מיקרון, נקבובי יותר — החוליה החלשה"),
          ("משחת צמנט", "Cement Paste", "C-S-H, CH ונקבוביות קפילריות")]
cols = [NAVY, LIME_D, TEXT]
for (t1, en, t2), ay, col in zip(labels, anch, cols):
    y = my + ay * scale
    text(s, 8.45, y - 0.5, 4.1, 0.4, [[(t1, {"bold": True, "color": col, "size": 18}),
                                       ("   " + en, {"color": MUTED, "size": 12})]])
    text(s, 8.45, y - 0.1, 4.1, 0.45, t2, size=14)
message(s, "שיפור ה-ITZ (W/C נמוך, מיקרוסיליקה, אגרגט נקי) = בטון חזק ועמיד יותר", y=5.85, h=0.62)

# ---------------------------------------------------------------- 11. Factors on hydration
s = content_slide("גורמים המשפיעים על הידרציה")
cx, cy = 6.72, 3.45
box(s, cx - 1.15, cy - 1.15, 2.3, 2.3, fill=NAVY, shape=MSO_SHAPE.OVAL)
text(s, cx - 1.1, cy - 0.4, 2.2, 0.8, "הידרציה", size=24, bold=True, color=WHITE, align="c", anchor="m")
facs = [("FaThermometerHalf", "טמפרטורה", "חום מאיץ את התגובה המוקדמת אך פוגע בחוזק הסופי; מתחת ל-5°C היא כמעט נעצרת", 9.0, 1.2),
        ("FaTint", "יחס W/C", "קובע כמה מים זמינים וכמה חללים יישארו", 0.9, 1.2),
        ("FaWarehouse", "סוג הצמנט", "דקות טחינה והרכב: CEM I מהיר, CEM III עם סיגים איטי", 9.0, 3.85),
        ("FaClock", "זמן", "ההידרציה נמשכת חודשים — כל עוד יש לחות", 0.9, 3.85)]
for ic, t1, t2, x, y in facs:
    box(s, x, y, 3.55, 1.9, fill=TINT)
    icon(s, ic, x + 3.55 - 0.5, y + 0.5, 0.65)
    text(s, x + 0.2, y + 0.25, 2.4, 0.45, t1, size=19, bold=True, color=NAVY)
    text(s, x + 0.2, y + 0.85, 3.15, 1.0, t2, size=14)
    ex = x if x > cx else x + 3.55
    line(s, cx + (1.1 if x > cx else -1.1), cy + (-0.5 if y < 3 else 0.5), ex, y + 0.95, color=GRAY, w=2,
         head=False)

# ---------------------------------------------------------------- 12. Structure development
s = content_slide("התפתחות המבנה: מבטון טרי לבטון קשוח")
stages = [("1", "פלסטי", "0-2 שעות", "ניתן להובלה, שאיבה, יציקה וריטוט", "7FC3EA"),
          ("2", "תחילת התקשרות", "2-4 שעות", "סוף חלון הריטוט; אסור להוסיף מים או לערבב מחדש", BLUE),
          ("3", "התקשות", "4-10 שעות", "סוף התקשרות; מתחילה עבודת החלקה והגנה מהתאדות", "1F5A94"),
          ("4", "קשיח", "מ-24 שעות", "צובר חוזק; פירוק תבניות לפי חוזק בפועל", NAVY)]
tw = 11.65 / 4
for i, (n, t1, tm, t2, col) in enumerate(stages):
    x = 12.55 - (i + 1) * tw
    r = box(s, x + 0.02, 2.0, tw - 0.04, 0.75, fill=col, shape=MSO_SHAPE.RECTANGLE)
    shape_text(r, t1, size=19)
    badge(s, n, x + tw - 0.35, 1.55, 0.55, fill=LIME, color=NAVY)
    text(s, x + 0.1, 2.85, tw - 0.2, 0.35, tm, size=15, color=BLUE, bold=True, align="c")
    text(s, x + 0.15, 3.25, tw - 0.3, 1.1, t2, size=14, align="c")
line(s, 12.55, 4.45, 0.95, 4.45, color=MUTED, w=2)
text(s, 0.9, 4.52, 3.5, 0.3, "זמן", size=13, color=MUTED, align="l")
caption(s, 0.9, 4.85, 11.65, "הזמנים טיפוסיים ל-20°C וצמנט רגיל; חום ומאיצים מקצרים, קור ומעכבים מאריכים")
message(s, "שגיאה בשלב הפלסטי (מים, ריטוט מאוחר) אינה ניתנת לתיקון", y=5.55, h=0.65)

# ================================================================ Section 3
divider(3, "חוזק הבטון", ["הגדרה", "התפתחות", "גורמים", "אשפרה", "דרגות חוזק"])

# ---------------------------------------------------------------- 13. What is strength
s = content_slide("מהו חוזק?")
pic_fit(s, "cube_load", 0.9, 1.2, 4.2, 4.6)
box(s, 5.6, 1.3, 6.95, 1.5, fill=NAVY)
text(s, 5.85, 1.35, 6.45, 1.4, "יכולת הבטון לשאת עומסי לחיצה ללא כשל", size=26, bold=True, color=WHITE,
     align="c", anchor="m")
box(s, 5.6, 3.05, 3.3, 1.75, fill=TINT)
text(s, 5.7, 3.15, 3.1, 1.6, [{"t": "f = F / A", "size": 30, "bold": True, "color": BLUE, "align": "c"},
                              {"t": "כוח השבר חלקי שטח החתך", "size": 14, "align": "c"},
                              {"t": "MPa = N/mm²", "size": 13, "color": MUTED, "align": "c"}], anchor="m")
box(s, 9.25, 3.05, 3.3, 1.75, fill=TINT)
text(s, 9.35, 3.15, 3.1, 1.6, [{"t": "דוגמה", "size": 15, "bold": True, "color": NAVY, "align": "c"},
                               {"t": "קובייה 150 מ\"מ נשברה ב-675 kN", "size": 14, "align": "c"},
                               {"t": "675,000 / 22,500 = 30 MPa", "size": 15, "bold": True, "color": BLUE,
                                "align": "c"}], anchor="m")
text(s, 5.6, 5.05, 6.95, 0.8, "חוזק הלחיצה הוא המדד המרכזי לאיכות הבטון, אבל לא היחיד: עמידות וחדירות נבדקות בנפרד",
     size=15, color=MUTED)

# ---------------------------------------------------------------- 14. Strength development
s = content_slide("התפתחות חוזק לאורך זמן")
cd = CategoryChartData()
cd.categories = ["1", "3", "7", "28", "90"]
curves = [("CEM I 52.5R", (40, 65, 80, 100, 105), NAVY),
          ("CEM I 42.5", (25, 52, 70, 100, 110), BLUE),
          ("CEM II/A", (18, 42, 62, 100, 115), GRAY),
          ("CEM III/A", (10, 30, 50, 100, 122), LIME_D)]
for nm, vals, _ in curves:
    cd.add_series(nm, vals)
gf = s.shapes.add_chart(XL_CHART_TYPE.LINE_MARKERS, I(0.9), I(1.15), I(8.0), I(4.85), cd)
ch = gf.chart
style_chart(ch)
ch.has_legend = True
ch.legend.position = XL_LEGEND_POSITION.BOTTOM
ch.legend.include_in_layout = False
ch.legend.font.size = Pt(12)
for ser, (_, _, col) in zip(ch.plots[0].series, curves):
    series_line(ser, col)
axis_fmt(ch.value_axis, rl("% מחוזק 28 יום"), fmt='0"%"')
ch.value_axis.maximum_scale = 130
ch.value_axis.minimum_scale = 0
ch.value_axis.major_unit = 20
axis_fmt(ch.category_axis, rl("גיל (ימים)"), gridlines=False)
caption(s, 0.9, 6.05, 8.0, "52.5R: חוזק מוקדם גבוה · CEM II: עם אבן גיר / אפר פחם · CEM III: עם סיגים. ערכים טיפוסיים להמחשה")
pts = [("28", "יום — גיל הייחוס", "החוזק המוזמן (ב-30, C30/37) נבדק בגיל 28 יום"),
       ("7", "ימים — אינדיקציה מוקדמת", "כ-65%-75% מחוזק 28 בצמנט רגיל"),
       ("90", "יום — המשך עלייה", "צמנטים עם תוספים ממשיכים לצבור חוזק")]
for i, (n, t1, t2) in enumerate(pts):
    y = 1.3 + i * 1.5
    text(s, 9.2, y, 3.35, 0.55, [[(n + " ", {"size": 30, "bold": True, "color": BLUE}),
                                   (t1, {"size": 15, "bold": True, "color": NAVY})]])
    text(s, 9.2, y + 0.6, 3.35, 0.8, t2, size=14)

# ---------------------------------------------------------------- 15. Factors on strength
s = content_slide("גורמים המשפיעים על החוזק")
facs = [("FaTint", "יחס W/C", "הגורם הדומיננטי: W/C נמוך יותר = חוזק גבוה יותר (חוק אברמס)", NAVY),
        ("FaWarehouse", "צמנט", "סוג, דרגת חוזק (42.5 / 52.5) ותכולה בתערובת", BLUE),
        ("FaCubes", "אגרגטים", "חוזק הסלע, צורה, ניקיון, גרדציה וגודל מקסימלי", BLUE),
        ("FaShieldAlt", "אשפרה", "בטון ללא אשפרה עלול להגיע לכ-50%-60% בלבד מהחוזק הפוטנציאלי", NAVY)]
for i, (ic, t1, t2, col) in enumerate(facs):
    x = 6.85 if i % 2 == 0 else 0.9
    y = 1.25 if i < 2 else 3.4
    box(s, x, y, 5.7, 1.95, fill=TINT)
    icon(s, ic, x + 5.7 - 0.6, y + 0.6, 0.8, fill=col)
    text(s, x + 0.25, y + 0.3, 4.4, 0.5, t1, size=21, bold=True, color=NAVY)
    text(s, x + 0.25, y + 0.9, 4.4, 0.95, t2, size=15)
message(s, "שלושה מתוך ארבעה גורמים נקבעים במפעל — האשפרה נקבעת באתר", y=5.75, h=0.65)

# ---------------------------------------------------------------- 16. Curing (added)
s = content_slide("אשפרה: הגורם שנשכח")
pic_fit(s, "curing", 0.9, 1.15, 4.6, 2.8)
cd = CategoryChartData()
cur = [("אשפרה רציפה", 100), ("שבוע אשפרה", 90), ("אשפרה קצרה", 80), ("ללא אשפרה", 60)]
cd.categories = [rl(c[0]) for c in reversed(cur)]
cd.add_series("חוזק יחסי", [c[1] for c in reversed(cur)])
gf = s.shapes.add_chart(XL_CHART_TYPE.BAR_CLUSTERED, I(5.75), I(1.15), I(6.8), I(2.9), cd)
ch = gf.chart
style_chart(ch, 12)
ch.has_legend = False
ch.has_title = True
ch.chart_title.text_frame.text = rl("חוזק יחסי בגיל 28 יום (%)")
for p in ch.chart_title.text_frame.paragraphs:
    for r in p.runs:
        set_font(r, 14, NAVY, True)
pl = ch.plots[0]
pl.gap_width = 60
pl.vary_by_categories = False
pl.series[0].format.fill.solid()
pl.series[0].format.fill.fore_color.rgb = rgb(BLUE)
pt = pl.series[0].points[0]
pt.format.fill.solid()
pt.format.fill.fore_color.rgb = rgb(GRAY)
pl.has_data_labels = True
pl.data_labels.number_format = '0"%"'
pl.data_labels.number_format_is_linked = False
pl.data_labels.position = XL_LABEL_POSITION.OUTSIDE_END
pl.data_labels.font.size = Pt(12)
pl.data_labels.font.bold = True
axis_fmt(ch.value_axis, gridlines=False)
ch.value_axis.visible = False
ch.value_axis.maximum_scale = 115
ch.value_axis.minimum_scale = 0
axis_fmt(ch.category_axis, gridlines=False)
caption(s, 5.75, 4.05, 6.8, "אשפרה קצרה = 3 ימים. מגמה טיפוסית לפי מחקרים קלאסיים (PCA) — להמחשה")
meths = [("FaWater", "הרטבה רציפה", "המטרה, הצפה, יוטה רטובה"),
         ("FaLayerGroup", "כיסוי", "יריעות פוליאתילן צמודות"),
         ("FaVial", "חומר אשפרה", "Curing Compound מיד אחרי ההחלקה"),
         ("FaClock", "משך", "לפחות 7 ימים; יותר עם סיגים/אפר פחם או בקור")]
for i, (ic, t1, t2) in enumerate(meths):
    x = 12.55 - (i + 1) * 2.93 + 0.08
    box(s, x, 4.5, 2.8, 1.25, fill=TINT)
    icon(s, ic, x + 2.8 - 0.38, 4.88, 0.5)
    text(s, x + 0.15, 4.62, 2.0, 0.45, t1, size=16, bold=True, color=NAVY)
    text(s, x + 0.15, 5.1, 2.5, 0.62, t2, size=13)
text(s, 0.9, 5.9, 8.9, 0.6, "האשפרה משפיעה בעיקר על שכבת הכיסוי — בדיוק השכבה שמגנה על הזיון",
     size=15, color=NAVY, bold=True)

# ---------------------------------------------------------------- 17. Strength classes
s = content_slide("דרגות חוזק")
text(s, 0.9, 1.1, 11.65, 0.5, "באתר ובמפעל מדברים ב\"ב-30\" — במפרטים ובתקנים האירופיים ב-C30/37. חשוב להכיר את שניהם",
     size=16, color=MUTED)
rows = [["EN 206", "המקבילה בת\"י 118", "fck גליל (MPa)", "fck קובייה (MPa)", "שימושים טיפוסיים"],
        ["C25/30", "ב-30", "25", "30", "יסודות, רצפות, מבני מגורים"],
        ["C30/37", "ב-35 / ב-40", "30", "37", "תקרות, קורות, עמודים"],
        ["C35/45", "ב-45", "35", "45", "אלמנטים טרומיים, סביבה אגרסיבית"],
        ["C40/50", "ב-50", "40", "50", "גשרים, טרום דרוך"],
        ["C50/60", "ב-60", "50", "60", "בטון בחוזק גבוה, רבי-קומות"]]
table(s, 0.9, 1.75, 11.65, rows, [1.6, 2.2, 1.8, 1.8, 4.25], size=15, row_h=0.55, header_h=0.55,
      align=["c", "c", "c", "c", "r"],
      cell_fill=lambda i, j: LIME_T if j == 1 else None)
box(s, 0.9, 5.25, 8.95, 1.2, fill=TINT)
icon(s, "FaLightbulb", 9.35, 5.85, 0.55)
text(s, 1.1, 5.32, 7.85, 1.05, [{"t": "המספר בשם הדרגה הישראלית = חוזק אופייני על קוביות.", "bold": True, "color": NAVY},
                                {"t": "C30/37 נופל בין ב-35 לב-40; ההשוואה לצורך הדרכה בלבד — הדרישה המחייבת היא של המתכנן והמפרט."}],
     size=14, anchor="m")

# ---------------------------------------------------------------- 18. Triangle
s = content_slide("משמעות החוזק: האיזון בתכן התערובת")
tri = box(s, 1.6, 1.4, 5.2, 4.3, fill=TINT, shape=MSO_SHAPE.ISOSCELES_TRIANGLE)
text(s, 2.7, 3.75, 3.0, 0.9, [{"t": "תכן תערובת", "size": 18, "bold": True, "color": NAVY},
                               {"t": "מאוזן", "size": 18, "bold": True, "color": NAVY}], align="c")
for ic, t1, cx_, cy_ in (("FaWeightHanging", "חוזק", 4.2, 1.35), ("FaShieldAlt", "עמידות", 6.8, 5.65),
                         ("FaHandPaper", "עבידות", 1.6, 5.65)):
    icon(s, ic, cx_, cy_, 1.0, fill=NAVY, ring=WHITE)
    if cy_ > 3:
        text(s, cx_ - 1.0, cy_ + 0.55, 2.0, 0.4, t1, size=18, bold=True, color=BLUE, align="c")
    else:
        text(s, cx_ + 0.6, cy_ - 0.2, 1.6, 0.4, t1, size=18, bold=True, color=BLUE, align="r")
rows_ = [("FaTint", "מוסיפים מים", "עבידות ↑  חוזק ↓  עמידות ↓", RED_T, RED),
         ("FaWarehouse", "מוסיפים צמנט בלבד", "חוזק ↑  עלות ↑  חום וסדיקה ↑", AMBER_T, AMBER),
         ("FaVial", "W/C נמוך + סופר-פלסטיצייזר", "חוזק ↑  עמידות ↑  עבידות נשמרת", GREEN_T, GREEN)]
for i, (ic, t1, t2, bg, col) in enumerate(rows_):
    y = 1.4 + i * 1.45
    box(s, 7.9, y, 4.65, 1.25, fill=bg)
    glyph(s, ic, 11.95, y + 0.35, 0.5, "b")
    text(s, 8.1, y + 0.12, 3.7, 0.45, t1, size=17, bold=True, color=NAVY)
    text(s, 8.1, y + 0.62, 3.7, 0.5, t2, size=15, bold=True, color=col)

# ================================================================ Section 4
divider(4, "יחס מים-צמנט", ["הגדרה", "W/C וחוזק", "W/C וחדירות", "W/C ועמידות", "מקרה שטח"])

# ---------------------------------------------------------------- 19. W/C definition
s = content_slide("יחס מים-צמנט (W/C)")
box(s, 3.4, 1.25, 9.15, 1.7, fill=NAVY)
text(s, 3.6, 1.3, 8.75, 1.6, [[("W/C  =  ", {"size": 34, "bold": True, "color": LIME}),
                               ("משקל המים (ק\"ג)  ÷  משקל הצמנט (ק\"ג)", {"size": 26, "bold": True, "color": WHITE})]],
     align="c", anchor="m")
icon(s, "FaBalanceScale", 2.1, 2.1, 1.5, fill=BLUE)
ex = [("180", "ליטר מים ל-מ\"ק"), ("÷", ""), ("360", "ק\"ג צמנט ל-מ\"ק"), ("=", ""), ("0.50", "W/C")]
xs = 11.0
for v, t_ in ex:
    w = 2.2 if t_ else 0.6
    xs -= w
    if t_:
        box(s, xs, 3.3, w, 1.35, fill=TINT)
        text(s, xs, 3.35, w, 1.25, [{"t": v, "size": 32, "bold": True, "color": BLUE if v != "0.50" else NAVY},
                                    {"t": t_, "size": 13}], align="c", anchor="m")
    else:
        text(s, xs, 3.3, w, 1.35, v, size=32, bold=True, color=MUTED, align="c", anchor="m")
    xs -= 0.15
notes = [("FaTint", "סופרים את כל המים", "כולל הלחות החופשית באגרגטים ומים מהמוספים"),
         ("FaRecycle", "W/B — מים לחומר מלכד", "כשיש תוספים: מחלקים בצמנט + אפר/סיגים/מיקרוסיליקה"),
         ("FaBook", "מגבלה תקנית", "EN 206 / ת\"י 118 קובעים W/C מרבי לפי דרגת החשיפה")]
for i, (ic, t1, t2) in enumerate(notes):
    x = 12.55 - (i + 1) * 3.88 + 0.08
    icon(s, ic, x + 3.4, 5.25, 0.55, fill=NAVY)
    text(s, x, 4.95, 3.0, 0.4, t1, size=16, bold=True, color=NAVY)
    text(s, x, 5.35, 3.0, 0.95, t2, size=13)

# ---------------------------------------------------------------- 20. W/C vs strength
s = content_slide("W/C וחוזק")
cd = XyChartData()
ser = cd.add_series(rl("חוזק גליל 28 יום"))
for wc, f in ((0.38, 44), (0.42, 40), (0.47, 35), (0.54, 30), (0.61, 25), (0.69, 20), (0.79, 15)):
    ser.add_data_point(wc, f)
gf = s.shapes.add_chart(XL_CHART_TYPE.XY_SCATTER_SMOOTH, I(0.9), I(1.15), I(7.6), I(4.8), cd)
ch = gf.chart
style_chart(ch)
ch.has_legend = False
series_line(ch.plots[0].series[0], BLUE, w=3.5, smooth=True)
axis_fmt(ch.value_axis, rl("חוזק לחיצה (MPa)"))
ch.value_axis.minimum_scale, ch.value_axis.maximum_scale, ch.value_axis.major_unit = 10, 50, 10
axis_fmt(ch.category_axis, rl("יחס מים-צמנט"), gridlines=False, fmt="0.00")
ch.category_axis.minimum_scale, ch.category_axis.maximum_scale, ch.category_axis.major_unit = 0.35, 0.80, 0.05
caption(s, 0.9, 6.0, 7.6, "מקור: ACI 211.1, בטון ללא אוויר מוחדר, חוזק גליל 28 יום — טיפוסי, להמחשה")
box(s, 8.85, 1.25, 3.7, 1.9, fill=NAVY)
text(s, 9.0, 1.3, 3.4, 1.8, [{"t": "ככל ש-W/C נמוך יותר", "size": 17, "color": WHITE, "bold": True},
                             {"t": "החוזק גבוה יותר", "size": 24, "color": LIME, "bold": True}], align="c",
     anchor="m")
box(s, 8.85, 3.35, 3.7, 1.25, fill=TINT)
text(s, 9.0, 3.4, 3.4, 1.15, [{"t": "W/C 0.47 → 0.61", "size": 22, "bold": True, "color": BLUE, "align": "c", "rtl": False},
                             {"t": "החוזק יורד בכ-30%, מ-35 ל-25 MPa", "size": 14, "align": "c"}], anchor="m")
text(s, 8.85, 4.8, 3.7, 1.0, "חוק אברמס (1918): החוזק תלוי ביחס המים-צמנט — כמעט בלי קשר לכמות הצמנט עצמה",
     size=13, color=MUTED)

# ---------------------------------------------------------------- 21. W/C and permeability
s = content_slide("W/C וחדירות")
pic_fit(s, "pores_dense", 6.95, 1.6, 5.6, 3.3)
pic_fit(s, "pores_open", 0.9, 1.6, 5.6, 3.3)
text(s, 6.95, 1.15, 5.6, 0.4, [[("W/C 0.40", {"bold": True, "color": NAVY, "size": 19}),
                                  ("  —  משחה צפופה", {"size": 17})]], align="c")
text(s, 0.9, 1.15, 5.6, 0.4, [[("W/C 0.70", {"bold": True, "color": RED, "size": 19}),
                                 ("  —  נקבוביות רציפות", {"size": 17})]], align="c")
text(s, 6.95, 5.0, 5.6, 0.75, [{"t": "נקבוביות קפילריות מעטות ומבודדות", "bullet": True},
                               {"t": "מים ויונים מתקשים לחדור", "bullet": True}], size=15)
text(s, 0.9, 5.0, 5.6, 0.75, [{"t": "רשת תעלות מחוברות לכל העומק", "bullet": True},
                              {"t": "מים, כלורידים ו-CO₂ חודרים בקלות", "bullet": True}], size=15)
message(s, "מעל W/C ≈ 0.6 הנקבוביות הופכות לרציפות — והחדירות עולה בסדרי גודל", y=5.85, h=0.62)

# ---------------------------------------------------------------- 22. W/C and durability
s = content_slide("W/C ועמידות")
pic_fit(s, "chloride", 0.9, 1.2, 7.3, 3.2)
text(s, 0.9, 4.45, 7.3, 0.6, "קו מקווקו = עומק כיסוי הבטון. משמאל: הכלורידים הגיעו לזיון, החלודה מתנפחת ומבקיעה את הבטון",
     size=13, color=MUTED)
imp = [("FaFlask", "כלורידים", "חודרים דרך הנקבוביות ומשמידים את שכבת ההגנה של הפלדה"),
       ("FaBolt", "קורוזיה", "חלודה תופסת פי 2-6 מנפח הפלדה — סדיקה והתפוררות"),
       ("FaTint", "חדירת מים", "מובילה מלחים, סולפטים ותגובות אלקלי-סיליקה")]
for i, (ic, t1, t2) in enumerate(imp):
    y = 1.25 + i * 1.35
    box(s, 8.5, y, 4.05, 1.2, fill=TINT)
    icon(s, ic, 12.05, y + 0.6, 0.62, fill=NAVY)
    text(s, 8.65, y + 0.1, 3.0, 0.4, t1, size=17, bold=True, color=NAVY)
    text(s, 8.65, y + 0.5, 3.0, 0.68, t2, size=13)
message(s, "בסביבה ימית ובחניונים: W/C מרבי 0.45 וכיסוי בטון לפי התקן — זו ההגנה העיקרית לזיון", y=5.25, h=0.85)

# ---------------------------------------------------------------- 23. Case study
s = content_slide("מקרה שטח: הוספת מים באתר")
cols3 = [("FaExclamationTriangle", "הבעיה", RED, RED_T,
          ["המשאית הגיעה לאחר המתנה ארוכה, בשקיעה נמוכה", "הצוות ביקש \"להוסיף קצת מים\" כדי לשאוב"]),
         ("FaSearch", "הגורם", AMBER, AMBER_T,
          ["תכנון לוגיסטי לקוי וזמן המתנה", "אין נוהל לתיקון עבידות במוסף", "לחץ זמנים — ללא תיעוד"]),
         ("FaArrowDown", "התוצאה", NAVY, TINT,
          ["חוזק נמוך מהדרישה בקוביות 28 יום", "חדירות גבוהה ואבק פני שטח", "מחלוקת אחריות מול הלקוח"])]
for i, (ic, t1, col, bg, items) in enumerate(cols3):
    x = 12.55 - (i + 1) * 3.95 + 0.1
    box(s, x, 1.2, 3.85, 2.75, fill=bg)
    icon(s, ic, x + 3.3, 1.7, 0.7, fill=col)
    text(s, x + 0.2, 1.48, 2.6, 0.45, t1, size=21, bold=True, color=col)
    text(s, x + 0.2, 2.2, 3.45, 1.7, [{"t": it, "bullet": True} for it in items], size=14)
    if i < 2:
        line(s, x + 0.02, 2.6, x - 0.08, 2.6, color=GRAY, w=3)
box(s, 0.9, 4.15, 11.65, 1.3, fill=TINT2)
calc = [("300 ק\"ג צמנט, 165 ל' מים", "W/C = 0.55", NAVY), ("+ 20 ל' מים למ\"ק", "W/C = 0.62", RED),
        ("ירידת חוזק צפויה (בקירוב)", "15%-20%", RED)]
for i, (t1, t2, col) in enumerate(calc):
    x = 12.55 - (i + 1) * 3.88 + 0.08
    text(s, x, 4.22, 3.7, 0.4, t1, size=14, color=MUTED, align="c")
    text(s, x, 4.65, 3.7, 0.7, t2, size=26, bold=True, color=col, align="c")
message(s, "הפתרון: מוסף מאושר בהנחיית המפעל ותיעוד — לעולם לא מים", y=5.65, h=0.7,
        ic="FaCheckCircle")

# ================================================================ Section 5
divider(5, "בדיקות בטון טרי", ["שקיעה", "טמפרטורה", "צפיפות", "כמות אוויר"])

# ---------------------------------------------------------------- 24. Fresh concrete
s = content_slide("מהו בטון טרי?")
text(s, 0.9, 1.15, 11.65, 0.5, "בטון במצב פלסטי, מרגע הערבוב ועד תחילת ההתקשרות. הבדיקות כאן הן ההזדמנות האחרונה לעצור משאית",
     size=16, color=MUTED)
tests = [("FaRulerVertical", "שקיעה", "עבידות ועקביות בין משאיות", "EN 12350-2 | ASTM C143"),
         ("FaThermometerHalf", "טמפרטורה", "סיכון להתקשרות מהירה או איטית", "ASTM C1064"),
         ("FaWeightHanging", "צפיפות", "בקרת תפוקה ופרופורציות", "EN 12350-6 | ASTM C138"),
         ("FaTachometerAlt", "כמות אוויר", "עמידות, חוזק ותפוקה", "EN 12350-7 | ASTM C231")]
for i, (ic, t1, t2, st) in enumerate(tests):
    x = 12.55 - (i + 1) * 2.92 + 0.07
    box(s, x, 1.85, 2.78, 3.35, fill=TINT)
    icon(s, ic, x + 1.39, 2.7, 1.1, fill=BLUE if i % 2 == 0 else NAVY)
    text(s, x + 0.1, 3.45, 2.58, 0.45, t1, size=21, bold=True, color=NAVY, align="c")
    text(s, x + 0.15, 3.95, 2.48, 0.7, t2, size=14, align="c")
    text(s, x + 0.1, 4.7, 2.58, 0.4, st, size=11, color=MUTED, align="c", rtl=False)
message(s, "בודקים את המשאית הראשונה, כל משאית חשודה — ולפי תכנית הדגימה", y=5.55, h=0.7)

# ---------------------------------------------------------------- 25. Slump test
s = content_slide("בדיקת שקיעה (Slump Test)")
pic_fit(s, "slump_cone", 0.9, 1.2, 6.2, 3.6)
text(s, 0.9, 4.85, 6.2, 0.35, "מידות החרוט במ\"מ: קוטר עליון 100, תחתון 200, גובה 300", size=13, color=MUTED,
     align="c")
steps = ["מרטיבים חרוט ומשטח, מניחים על בסיס יציב ואופקי",
         "ממלאים ב-3 שכבות שוות, כל אחת 25 דקירות במוט",
         "מיישרים את פני הבטון ומנקים סביב החרוט",
         "מרימים אנכית ובאחידות, ללא סיבוב (2-5 שניות)",
         "מודדים מגובה החרוט עד מרכז הבטון השוקע",
         "רושמים את התוצאה ואת צורת השקיעה"]
for i, st in enumerate(steps):
    y = 1.25 + i * 0.72
    badge(s, i + 1, 12.25, y + 0.28, 0.48, fill=BLUE)
    text(s, 7.5, y, 4.4, 0.62, st, size=15, anchor="m")
message(s, "מסיימים את הבדיקה תוך 2.5 דקות מהמילוי", x=0.9, w=6.2, y=5.4, h=0.7, ic="FaClock")

# ---------------------------------------------------------------- 26. Slump interpretation
s = content_slide("פענוח תוצאות שקיעה")
kinds = [("slump_low", "נמוכה מדי", AMBER, AMBER_T, "קשה לשאיבה ולריטוט; סיכון לקיני חצץ",
          "בדיקת זמן המתנה; תיקון רק במוסף מאושר"),
         ("slump_ok", "תקינה", GREEN, GREEN_T, "שקיעה סימטרית בטווח ההזמנה",
          "מאשרים ומתעדים"),
         ("slump_high", "גבוהה מדי", RED, RED_T, "חשד לעודף מים; סגרגציה ודימום",
          "עצירה, בדיקה חוזרת, החלטה על דחייה")]
for i, (img, t1, col, bg, t2, t3) in enumerate(kinds):
    x = 12.55 - (i + 1) * 3.88 + 0.08
    box(s, x, 1.2, 3.8, 4.1, fill=bg)
    pic_fit(s, img, x + 0.3, 1.35, 3.2, 1.75)
    text(s, x + 0.15, 3.2, 3.5, 0.45, t1, size=22, bold=True, color=col, align="c")
    text(s, x + 0.2, 3.7, 3.4, 0.7, t2, size=14, align="c")
    text(s, x + 0.2, 4.45, 3.4, 0.75, [[("פעולה: ", {"bold": True, "color": NAVY}), (t3, {})]], size=13,
         align="c")
rows = [["S1", "S2", "S3", "S4", "S5"], ["10-40", "50-90", "100-150", "160-210", "220 ומעלה"]]
text(s, 9.6, 5.5, 2.95, 0.35, "מחלקות שקיעה EN 206 (מ\"מ)", size=13, bold=True, color=NAVY)
table(s, 0.9, 5.45, 8.5, rows, [1, 1, 1, 1, 1], size=13, row_h=0.4, header_h=0.4, align=["c"] * 5,
      bold_first=False)

# ---------------------------------------------------------------- 27. Temperature
s = content_slide("בדיקת טמפרטורה")
zones = [(0, 5, "4A6FA5", "סכנת קפיאה", "ההידרציה כמעט נעצרת"),
         (5, 10, "7FA7D6", "איטי", "התקשרות ממושכת"),
         (10, 30, GREEN, "תקין", "טווח עבודה רגיל"),
         (30, 35, AMBER, "חם", "נדרשים אמצעי קיץ"),
         (35, 40, RED, "סיכון גבוה", "בדרך כלל מחוץ למפרט")]
sx, sw = 0.9, 11.65
for a, b_, col, t1, t2 in zones:
    x = sx + sw - (b_ / 40) * sw
    w = (b_ - a) / 40 * sw
    r = box(s, x, 1.55, w - 0.03, 0.9, fill=col, shape=MSO_SHAPE.RECTANGLE)
    shape_text(r, t1, size=15 if w > 1.2 else 13)
    text(s, x, 2.52, w - 0.03, 0.55, t2, size=12, color=MUTED, align="c")
for v in (0, 5, 10, 30, 35, 40):
    x = sx + sw - (v / 40) * sw
    text(s, x - 0.35, 1.18, 0.7, 0.32, f"{v}°C", size=13, bold=True, color=NAVY, align="c", rtl=False)
eff = [("FaSun", "בטון חם", ["התקשרות מהירה ואיבוד שקיעה", "סדיקה פלסטית ותרמית", "חוזק סופי נמוך יותר"], RED),
       ("FaSnowflake", "בטון קר", ["התקשרות והתפתחות חוזק איטיות", "פירוק תבניות מאוחר", "סכנת קפיאה בגיל צעיר"], BLUE),
       ("FaThermometerHalf", "איך מודדים", ["מדחום מכויל, טבילה של 75 מ\"מ לפחות", "2-5 דקות עד התייצבות", "רישום גם של טמפרטורת האוויר"], NAVY)]
for i, (ic, t1, items, col) in enumerate(eff):
    x = 12.55 - (i + 1) * 3.88 + 0.08
    box(s, x, 3.3, 3.8, 2.3, fill=TINT)
    icon(s, ic, x + 3.3, 3.8, 0.62, fill=col)
    text(s, x + 0.2, 3.55, 2.7, 0.45, t1, size=18, bold=True, color=NAVY)
    text(s, x + 0.2, 4.2, 3.4, 1.4, [{"t": it, "bullet": True} for it in items], size=13)
caption(s, 0.9, 5.75, 9.0, "הגבולות בפועל נקבעים במפרט ובתקן החל על הפרויקט; הטווחים כאן להמחשה")

# ---------------------------------------------------------------- 28. Density
s = content_slide("בדיקת צפיפות")
pic_fit(s, "density", 0.9, 1.25, 3.6, 3.8)
box(s, 4.85, 1.25, 7.7, 1.9, fill=TINT)
text(s, 5.05, 1.3, 7.3, 0.45, "מה מטרתה?", size=19, bold=True, color=NAVY)
text(s, 5.05, 1.8, 7.3, 1.3, [{"t": "בדיקת תפוקה — האם הלקוח מקבל מ\"ק מלא", "bullet": True},
                              {"t": "אימות פרופורציות התערובת ואינדיקציה לתכולת אוויר", "bullet": True},
                              {"t": "טיפוסי: 2,300-2,450 ק\"ג/מ\"ק לבטון רגיל", "bullet": True}], size=14)
text(s, 4.85, 3.35, 7.7, 0.45, "איך מבצעים?", size=19, bold=True, color=NAVY)
how = ["שוקלים מיכל ריק בנפח ידוע", "ממלאים בשכבות ומהדקים", "מיישרים ומנקים את הדפנות", "שוקלים ומחשבים"]
for i, t_ in enumerate(how):
    x = 12.55 - (i + 1) * 1.93 + 0.05
    badge(s, i + 1, x + 0.94, 4.1, 0.5, fill=BLUE)
    text(s, x, 4.45, 1.88, 0.75, t_, size=13, align="c")
box(s, 4.85, 5.3, 7.7, 0.85, fill=NAVY)
text(s, 5.0, 5.33, 7.4, 0.8, [{"t": "ρ = (M₂ − M₁) / V", "bold": True, "color": WHITE, "size": 20, "rtl": False},
                              {"t": "M₂ מיכל מלא  •  M₁ מיכל ריק  •  V נפח המיכל", "color": WHITE, "size": 12}],
     align="c", anchor="m", space_after=0)

# ---------------------------------------------------------------- 29. Air content
s = content_slide("כמות אוויר")
pic_fit(s, "air_meter", 0.9, 1.25, 3.5, 4.0)
caption(s, 0.9, 5.3, 3.5, "מד אוויר בשיטת הלחץ", align="c")
box(s, 8.75, 1.25, 3.8, 3.4, fill=GREEN_T)
icon(s, "FaCheckCircle", 12.1, 1.7, 0.6, fill=GREEN)
text(s, 8.95, 1.5, 2.7, 0.45, "יתרונות", size=20, bold=True, color=GREEN)
text(s, 8.95, 2.2, 3.4, 2.4, [{"t": "עמידות למחזורי קפיאה-הפשרה", "bullet": True},
                              {"t": "שיפור עבידות וקוהזיה", "bullet": True},
                              {"t": "הפחתת דימום וסגרגציה", "bullet": True}], size=14)
box(s, 4.75, 1.25, 3.8, 3.4, fill=RED_T)
icon(s, "FaTimesCircle", 8.1, 1.7, 0.6, fill=RED)
text(s, 4.95, 1.5, 2.7, 0.45, "חסרונות", size=20, bold=True, color=RED)
text(s, 4.95, 2.2, 3.4, 2.4, [{"t": "כל 1% אוויר ≈ 5% ירידה בחוזק", "bullet": True},
                              {"t": "השפעה על התפוקה והצפיפות", "bullet": True},
                              {"t": "רגישות לסוג המוסף ולזמן הערבוב", "bullet": True}], size=14)
box(s, 4.75, 4.85, 7.8, 1.3, fill=TINT)
text(s, 4.95, 4.9, 7.4, 1.2, [{"t": "בבטון רגיל בישראל: אוויר כלוא של 1%-2%. אוויר מוחדר מכוון — רק כשנדרש במפרט.",
                               "bold": True, "color": NAVY},
                              {"t": "תוצאה גבוהה בלי מוסף מחדיר אוויר = סימן לבעיה בתערובת"}], size=14, anchor="m")

# ================================================================ Section 6
divider(6, "בדיקות בטון קשוח", ["קוביות, גלילים וקרוטים", "בדיקת לחיצה", "פענוח תוצאות"])

# ---------------------------------------------------------------- 30. Hardened concrete
s = content_slide("בדיקות בטון קשוח")
specs = [("spec_cube", "קוביות", "100 או 150 מ\"מ", "השיטה הנפוצה בישראל ובאירופה; פשוטה ליציקה ולבדיקה", "EN 12390-1/3"),
         ("spec_cyl", "גלילים", "150×300 או 100×200 מ\"מ", "השיטה בארה\"ב ובחלק מהמפרטים; דורשת יישור קצוות", "ASTM C39 | EN 12390-3"),
         ("spec_core", "קרוטים", "קידוח מהמבנה", "הערכת חוזק בפועל במקרי ספק או כשל", "EN 12504-1 | ASTM C42")]
for i, (img, t1, t2, t3, st) in enumerate(specs):
    x = 12.55 - (i + 1) * 3.88 + 0.08
    box(s, x, 1.2, 3.8, 4.95, fill=TINT)
    pic_fit(s, img, x + 0.6, 1.35, 2.6, 2.3)
    text(s, x + 0.15, 3.75, 3.5, 0.45, t1, size=22, bold=True, color=NAVY, align="c")
    text(s, x + 0.15, 4.2, 3.5, 0.35, t2, size=15, bold=True, color=BLUE, align="c")
    text(s, x + 0.25, 4.62, 3.3, 0.9, t3, size=13, align="c")
    text(s, x + 0.15, 5.65, 3.5, 0.35, st, size=11, color=MUTED, align="c", rtl=False)

# ---------------------------------------------------------------- 31. Compression test
s = content_slide("בדיקת לחיצה")
pic_fit(s, "press", 0.9, 1.15, 4.0, 4.6)
steps = [("דגימה", "מהמשאית בהתאם לתכנית, EN 12350-1"),
         ("יציקה והידוק", "בתבניות נקיות ומשומנות"),
         ("24 שעות ראשונות", "באתר, מוגן מזעזועים, חום והתייבשות"),
         ("אשפרה במעבדה", "במים או בתא לחות, 20±2°C"),
         ("לחיצה בגיל הבדיקה", "קצב העמסה קבוע 0.6±0.2 MPa/s עד לשבר"),
         ("רישום ופענוח", "עומס, חוזק, צורת השבר וחריגות")]
for i, (t1, t2) in enumerate(steps):
    col = i % 2
    row = i // 2
    x = 8.85 - col * 3.9
    y = 1.25 + row * 1.55
    box(s, x, y, 3.7, 1.35, fill=TINT)
    badge(s, i + 1, x + 3.3, y + 0.38, 0.5, fill=BLUE)
    text(s, x + 0.2, y + 0.15, 2.8, 0.45, t1, size=17, bold=True, color=NAVY)
    text(s, x + 0.2, y + 0.62, 3.3, 0.7, t2, size=13)
text(s, 5.15, 5.95, 7.4, 0.5, "שבר תקין בקובייה: שתי פירמידות הפוכות. שבר חריג מעיד בדרך כלל על הכנה או אשפרה לקויות",
     size=13, color=MUTED)

# ---------------------------------------------------------------- 32. Cubes vs cylinders
s = content_slide("קוביות מול גלילים")
rows = [["פרמטר", "קוביות", "גלילים"],
        ["מידות נפוצות", "150 או 100 מ\"מ", "150×300 או 100×200 מ\"מ"],
        ["תקנים", "EN 12390-3, ת\"י 26", "ASTM C39, EN 12390-3"],
        ["יחס חוזק טיפוסי", "100%", "כ-80% מחוזק הקובייה"],
        ["הכנת פני הלחיצה", "לא נדרשת (לוחצים על פאות התבנית)", "השחזה או כיפוי (Capping)"],
        ["רגישות לביצוע", "נמוכה יחסית", "גבוהה: אנכיות, מישוריות הקצוות"],
        ["שימוש עיקרי", "ישראל ואירופה", "ארה\"ב; מקובל גם במפרטים בינלאומיים"]]
table(s, 0.9, 1.25, 11.65, rows, [2.8, 4.4, 4.45], size=15, row_h=0.6, header_h=0.6,
      align=["r", "c", "c"], cell_fill=lambda i, j: TINT if j == 0 else None)
message(s, "C30/37: 30 = חוזק גליל, 37 = חוזק קובייה. אותו בטון — שתי שיטות מדידה", y=5.75, h=0.65)

# ---------------------------------------------------------------- 33. Interpreting results
s = content_slide("פענוח תוצאות חוזק")
res = [41, 39, 43, 40, 42, 38, 41, 44, 40, 39, 41, 31, 40, 39, 38, 37, 38, 36, 37, 36]
mov = [None, None] + [round(sum(res[i - 2:i + 1]) / 3, 1) for i in range(2, len(res))]
cd = CategoryChartData()
cd.categories = [str(i + 1) for i in range(len(res))]
cd.add_series(rl("תוצאה בודדת"), res)
cd.add_series(rl("ממוצע נע (3)"), mov)
cd.add_series("fck = 37", [37] * len(res))
cd.add_series("fck + 4", [41] * len(res))
gf = s.shapes.add_chart(XL_CHART_TYPE.LINE_MARKERS, I(0.9), I(1.15), I(7.7), I(4.7), cd)
ch = gf.chart
style_chart(ch)
ch.has_legend = True
ch.legend.position = XL_LEGEND_POSITION.BOTTOM
ch.legend.include_in_layout = False
ser = ch.plots[0].series
series_line(ser[0], BLUE, w=1.75)
series_line(ser[1], NAVY, w=3, marker=False)
series_line(ser[2], RED, w=2, marker=False, dash=True)
series_line(ser[3], GREEN, w=1.5, marker=False, dash=True)
pt = ser[0].points[11]
pt.marker.format.fill.solid()
pt.marker.format.fill.fore_color.rgb = rgb(RED)
pt.marker.size = 12
axis_fmt(ch.value_axis, rl("חוזק קובייה (MPa)"))
ch.value_axis.minimum_scale, ch.value_axis.maximum_scale, ch.value_axis.major_unit = 28, 48, 4
axis_fmt(ch.category_axis, rl("מספר דגימה"), gridlines=False)
caption(s, 0.9, 5.9, 7.7, "דוגמה להמחשה: ב-37 (C30/37). קריטריוני ההתאמה המלאים — לפי EN 206 / ת\"י 118")
conc = [("FaChartLine", "Trend — מגמה", "ירידה עקבית בממוצע הנע (דגימות 13-20): לחקור חומרי גלם, מינון, ציוד"),
        ("FaExclamationTriangle", "Outlier — חריג", "דגימה 12 בודדת ונמוכה: לבדוק דגימה, הכנה ואשפרה לפני מסקנות"),
        ("FaBalanceScale", "בקרה סטטיסטית", "ממוצע 15 תוצאות: לפחות fck + 1.48σ. תוצאה בודדת: לא פחות מ-fck − 4")]
for i, (ic, t1, t2) in enumerate(conc):
    y = 1.2 + i * 1.6
    box(s, 8.85, y, 3.7, 1.45, fill=TINT)
    icon(s, ic, 12.1, y + 0.42, 0.55, fill=NAVY)
    text(s, 9.0, y + 0.15, 2.75, 0.45, t1, size=16, bold=True, color=NAVY)
    text(s, 9.0, y + 0.72, 3.35, 0.72, t2, size=12)

# ================================================================ Section 7
divider(7, "כשלים נפוצים", ["סגרגציה", "דימום", "קיני חצץ", "סדיקה פלסטית", "התקלפות"])


def defect(title, en, img, causes, prevent, note=None):
    s = content_slide(f"{title}  |  {en}")
    pic_fit(s, img, 0.9, 1.2, 5.9, 4.3)
    if note:
        caption(s, 0.9, 5.55, 5.9, note, align="c")
    for k, (hdr, items, col, bg, ic) in enumerate((("גורמים", causes, RED, RED_T, "FaSearch"),
                                                     ("מניעה", prevent, GREEN, GREEN_T, "FaShieldAlt"))):
        y = 1.2 if k == 0 else 3.75
        h = 2.4
        box(s, 7.1, y, 5.45, h, fill=bg)
        icon(s, ic, 12.05, y + 0.45, 0.55, fill=col)
        text(s, 7.3, y + 0.2, 4.2, 0.45, hdr, size=19, bold=True, color=col)
        text(s, 7.3, y + 0.8, 5.05, h - 0.9, [{"t": it, "bullet": True} for it in items], size=14, space_after=2)
    return s


defect("סגרגציה", "Segregation", "segregation",
       ["הטלה מגובה רב (מעל 1.5 מ') או דרך מזחלה ארוכה", "עודף מים / שקיעה גבוהה מדי", "ריטוט יתר או גרירת בטון בוויברטור",
        "גרדציה לקויה, מחסור בחומר דק"],
       ["שרוול או משפך עד קרוב לנקודת היציקה", "שקיעה בטווח ההזמנה, ללא תוספת מים", "ריטוט נקודתי וקצר",
        "תכן תערובת קוהזיבי"],
       "האגרגט הגס נפרד ומצטבר בתחתית; משחה עשירה נשארת למעלה")
defect("דימום", "Bleeding", "bleeding",
       ["W/C גבוה ומחסור בחומר דק", "התקשרות איטית (קור, מעכב במינון יתר)", "יציקות עמוקות", "אגרגט עם גרדציה פתוחה"],
       ["תכן עם מספיק דקים או תוספים", "מינון מוספים לפי הנחיה", "לא להחליק כשיש מים על הפנים", "יציקה בשכבות"],
       "מים עולים לפני השטח ונלכדים מתחת לאגרגטים ולמוטות הזיון")
defect("קיני חצץ", "Honeycombs", "honeycomb",
       ["ריטוט חסר או לא אחיד", "צפיפות זיון מול גודל אגרגט מרבי", "דליפת משחה מתבניות לא אטומות", "עבידות נמוכה וסגרגציה"],
       ["תכנית ריטוט: מרחקים ועומקים", "התאמת גודל האגרגט לצפיפות הזיון", "אטימת מישקי תבניות",
        "שקיעה מתאימה לאלמנט"],
       "אזור עם אגרגט חשוף וחללים, בדרך כלל בתחתית קירות ועמודים")
defect("סדיקה פלסטית", "Plastic Shrinkage", "plastic",
       ["רוח — מגבירה התאדות", "חום וקרינת שמש", "אידוי מהיר מקצב הדימום (מעל ~1 ק\"ג/מ\"ר/שעה)", "לחות יחסית נמוכה"],
       ["שוברי רוח וצל", "ערפול מים או חומר מעכב התאדות", "יציקה בשעות קרירות", "אשפרה מיד אחרי ההחלקה"],
       "סדקים קצרים ומקבילים בשעות הראשונות, לפני ההתקשות")
defect("התקלפות", "Scaling", "scaling",
       ["החלקה בזמן שיש מי דימום על הפנים", "החלקת יתר או פיזור צמנט יבש על הפנים", "אשפרה חסרה בשכבה העליונה",
        "W/C גבוה בפני השטח"],
       ["החלקה רק אחרי היעלמות מי הדימום", "אשפרה מיידית ומלאה", "W/C נמוך ובטון קוהזיבי",
        "תיקון: השחזה ושכבה מתקנת ייעודית"],
       "שכבה דקה עליונה מתקלפת וחושפת את האגרגט")

# ================================================================ Section 8
divider(8, "בקרת חומרי גלם", ["תהליך קבלה", "אגרגטים", "צמנט", "מוספים", "זיהוי חומרים פסולים", "מטריצת סיכונים"])

# ---------------------------------------------------------------- 38. Raw-material control flow
s = content_slide("בקרת חומרי גלם: תהליך הקבלה")
flow = [("FaTruck", "קבלה", "תעודת משלוח, זיהוי ספק ותאריך, בדיקה ויזואלית"),
        ("FaFlask", "בדיקה", "דגימה ובדיקות לפי תכנית הבקרה"),
        ("FaClipboardCheck", "אישור", "השוואה לדרישות התקן והמפרט"),
        ("FaIndustry", "שימוש", "שחרור לממגורה או לערמה, עם עקיבות")]
for i, (ic, t1, t2) in enumerate(flow):
    x = 12.55 - (i + 1) * 2.95 + 0.1
    box(s, x, 1.3, 2.75, 2.3, fill=NAVY if i == 2 else TINT)
    icon(s, ic, x + 1.375, 1.9, 0.8, fill=LIME if i == 2 else BLUE, color="n" if i == 2 else "w")
    text(s, x + 0.1, 2.4, 2.55, 0.45, t1, size=20, bold=True, color=WHITE if i == 2 else NAVY, align="c")
    text(s, x + 0.15, 2.85, 2.45, 0.7, t2, size=13, color=WHITE if i == 2 else TEXT, align="c")
    if i < 3:
        line(s, x - 0.01, 2.45, x - 0.19, 2.45, color=BLUE, w=3)
# decision under "בדיקה": fail -> quarantine (right), pass -> up into "אישור"
bx_test = 12.55 - 2 * 2.95 + 0.1          # left edge of the "בדיקה" card
cx_test, cx_appr = bx_test + 1.375, bx_test - 2.95 + 1.375
dia = box(s, cx_test - 1.0, 3.9, 2.0, 1.15, fill=AMBER_T, line=AMBER, lw=2, shape=MSO_SHAPE.DIAMOND)
shape_text(dia, "תקין?", size=16, color=NAVY)
line(s, cx_test, 3.62, cx_test, 3.9, color=BLUE, w=2.5)
line(s, cx_test + 1.0, 4.47, 9.95, 4.47, color=RED, w=2.5)
text(s, cx_test + 1.0, 4.05, 0.7, 0.35, "לא", size=13, bold=True, color=RED, align="c")
r = box(s, 9.95, 3.9, 2.6, 1.15, fill=RED_T, line=RED, lw=1.5)
shape_text(r, [[("הסגר וסימון", {"bold": True, "color": RED, "size": 15})],
               [("החזרה לספק + דוח אי-התאמה", {"bold": False, "color": TEXT, "size": 12})]])
line(s, cx_test - 1.0, 4.47, cx_appr, 4.47, color=GREEN, w=2.5, head=False)
line(s, cx_appr, 4.47, cx_appr, 3.62, color=GREEN, w=2.5)
text(s, cx_test - 1.7, 4.05, 0.7, 0.35, "כן", size=13, bold=True, color=GREEN, align="c")
text(s, 0.9, 3.85, 4.1, 1.6, [{"t": "חומר שלא אושר — לא נכנס לממגורה או לערמה הפעילה", "bullet": True},
                              {"t": "כל משלוח ניתן לאיתור עד היציקה", "bullet": True},
                              {"t": "תיעוד: מי בדק, מתי ומה הוחלט", "bullet": True}], size=13)
message(s, "המקום הזול ביותר לעצור בעיה הוא בשער המפעל", y=5.65, h=0.7)

# ---------------------------------------------------------------- 39. Aggregate tests
s = content_slide("בדיקות איכות אגרגטים")
cd = CategoryChartData()
sieves = ["0.063", "0.125", "0.25", "0.5", "1", "2", "4", "8", "16", "22.4"]
cd.categories = sieves
cd.add_series(rl("גבול תחתון"), [0, 2, 6, 12, 20, 28, 36, 52, 78, 95])
cd.add_series(rl("גבול עליון"), [3, 8, 16, 26, 36, 46, 58, 76, 95, 100])
cd.add_series(rl("דגימה"), [1.5, 4, 10, 17, 25, 33, 44, 61, 86, 99])
gf = s.shapes.add_chart(XL_CHART_TYPE.LINE_MARKERS, I(0.9), I(1.15), I(6.5), I(4.6), cd)
ch = gf.chart
style_chart(ch)
ch.has_legend = True
ch.legend.position = XL_LEGEND_POSITION.BOTTOM
ch.legend.include_in_layout = False
ser = ch.plots[0].series
series_line(ser[0], GRAY, w=2, marker=False, dash=True)
series_line(ser[1], GRAY, w=2, marker=False, dash=True)
series_line(ser[2], BLUE, w=3)
axis_fmt(ch.value_axis, rl("% עובר"))
ch.value_axis.minimum_scale, ch.value_axis.maximum_scale, ch.value_axis.major_unit = 0, 100, 20
axis_fmt(ch.category_axis, rl("פתח נפה (מ\"מ)"), gridlines=False)
caption(s, 0.9, 5.8, 6.5, "עקומת דירוג בתוך מעטפת דרישה — דוגמה להמחשה")
tests = [("FaFilter", "גרדציה", "ניפוי לפי EN 933-1 / ASTM C136; עקביות בין משלוחים", "EN 933-1"),
         ("FaTint", "ספיגות", "קובעת תיקון מים בתערובת; ספיגות גבוהה = אגרגט חלש", "EN 1097-6"),
         ("FaCogs", "LA Abrasion", "עמידות לשחיקה ולשבירה בתוף לוס אנג'לס", "EN 1097-2"),
         ("FaMicroscope", "חומר אורגני וחרסית", "פוגעים בהתקשרות ובקשר עם המשחה", "ASTM C40")]
for i, (ic, t1, t2, st) in enumerate(tests):
    y = 1.2 + i * 1.18
    box(s, 7.7, y, 4.85, 1.05, fill=TINT)
    icon(s, ic, 12.1, y + 0.52, 0.55, fill=NAVY)
    text(s, 7.85, y + 0.08, 3.6, 0.4, t1, size=16, bold=True, color=NAVY)
    text(s, 7.85, y + 0.48, 3.75, 0.55, t2, size=12)

# ---------------------------------------------------------------- 40. Cement tests
s = content_slide("בדיקות איכות צמנט")
cols_ = [("FaCertificate", "תעודות יצרן", ["תו תקן לפי ת\"י 1 / סימון CE", "תעודת משלוח: סוג, דרגה ומשקל",
                                             "דוח איכות תקופתי מהיצרן"], "כל משלוח"),
         ("FaHourglassHalf", "זמן התקשרות", ["מחט ויקה — EN 196-3", "תחילת התקשרות: לפחות 45-75 דקות, לפי הדרגה",
                                              "חריגה מעידה על בעיית ייצור או אחסון"], "תקופתית / בחשד"),
         ("FaCompressArrowsAlt", "חוזק", ["מנסרות טיט 40×40×160 — EN 196-1", "בגיל 2 / 7 ו-28 יום",
                                          "השוואה לדרגה: 42.5 / 52.5 MPa"], "לפי תכנית")]
for i, (ic, t1, items, fr) in enumerate(cols_):
    x = 12.55 - (i + 1) * 3.88 + 0.08
    box(s, x, 1.2, 3.8, 3.9, fill=TINT)
    icon(s, ic, x + 1.9, 1.95, 1.0, fill=BLUE if i != 1 else NAVY)
    text(s, x + 0.15, 2.6, 3.5, 0.45, t1, size=20, bold=True, color=NAVY, align="c")
    text(s, x + 0.25, 3.15, 3.3, 1.5, [{"t": it, "bullet": True} for it in items], size=13)
    r = box(s, x + 0.8, 4.65, 2.2, 0.35, fill=LIME, radius=0.5)
    shape_text(r, fr, size=12, color=NAVY)
message(s, "בודקים גם את האחסון: צמנט חם או לח משנה התקשרות ועבידות", y=5.4, h=0.75)

# ---------------------------------------------------------------- 41. Admixture tests
s = content_slide("בדיקות איכות מוספים")
text(s, 0.9, 1.1, 11.65, 0.45, "בדיקות זהות מהירות בקבלה — השוואה לערך שהצהיר היצרן (ת\"י 896 / EN 934 / ASTM C494)",
     size=15, color=MUTED)
adm = [("FaWeightHanging", "צפיפות", "±0.02-0.03", "גרם/סמ\"ק מהערך המוצהר", "הידרומטר / פיקנומטר"),
       ("FaFlask", "pH", "±1", "יחידת pH מהמוצהר", "מד pH מכויל"),
       ("FaFilter", "מוצקים", "±5%", "יחסי מהערך המוצהר", "ייבוש ב-105°C"),
       ("FaTint", "צמיגות", "השוואה", "לדגימת ייחוס מאושרת", "צמיגומטר / משפך")]
for i, (ic, t1, v, unit, how) in enumerate(adm):
    x = 12.55 - (i + 1) * 2.92 + 0.07
    box(s, x, 1.75, 2.78, 3.6, fill=TINT)
    icon(s, ic, x + 1.39, 2.45, 0.9, fill=BLUE if i % 2 == 0 else NAVY)
    text(s, x + 0.1, 3.05, 2.58, 0.45, t1, size=20, bold=True, color=NAVY, align="c")
    text(s, x + 0.1, 3.55, 2.58, 0.55, v, size=26, bold=True, color=BLUE, align="c", rtl=v == "השוואה")
    text(s, x + 0.1, 4.12, 2.58, 0.4, unit, size=12, align="c")
    text(s, x + 0.1, 4.7, 2.58, 0.4, how, size=12, color=MUTED, align="c")
message(s, "לבדוק גם: תאריך תפוגה, הפרדת פאזות במיכל וזיהוי נכון של המוסף בצנרת המינון", y=5.6, h=0.75)

# ---------------------------------------------------------------- 42. Rejected materials gallery
s = content_slide("זיהוי חומרים פסולים")
tiles = [("tile_ok", True, "תקין", "אגרגט נקי, צבע אחיד, ללא ציפוי"),
         ("tile_clay", False, "חרסית", "ציפוי וגושים חומים; נמרח ביד רטובה"),
         ("tile_lumps", False, "גושי צמנט", "גושים קשים שאינם מתפוררים באצבע"),
         ("tile_organic", False, "חומר אורגני", "שורשים, עלים, צבע כהה וריח"),
         ("tile_phase", False, "הפרדת פאזות", "שכבות נפרדות במיכל המוסף")]
tw_, gap_ = 2.2, 0.16
for i, (img, ok, t1, t2) in enumerate(tiles):
    x = 12.55 - (i + 1) * tw_ - i * gap_
    col = GREEN if ok else RED
    box(s, x, 1.25, tw_, 4.4, fill=GREEN_T if ok else RED_T)
    pic_fit(s, img, x + 0.1, 1.35, tw_ - 0.2, 1.6)
    icon(s, "FaCheckCircle" if ok else "FaTimesCircle", x + tw_ / 2, 3.35, 0.65, fill=col)
    text(s, x + 0.1, 3.8, tw_ - 0.2, 0.45, t1, size=19, bold=True, color=col, align="c")
    text(s, x + 0.15, 4.3, tw_ - 0.3, 1.2, t2, size=13, align="c")
caption(s, 0.9, 5.75, 11.65, "איורים להמחשה. מומלץ להחליף בתמונות אמיתיות מהמפעלים, לצורך זיהוי מדויק בשטח", align="c")

# ---------------------------------------------------------------- 43. Risk matrix
s = content_slide("מטריצת סיכוני איכות")
risks = [("אגרגט דק", "חרסית / עודף דקים", 3, 4), ("אגרגט גס", "גרדציה חורגת", 3, 3),
         ("צמנט", "סוג שגוי בממגורה", 2, 5), ("צמנט", "לחות וגושים", 2, 3),
         ("מוסף", "מינון שגוי", 2, 5), ("מוסף", "הפרדת פאזות", 2, 4), ("מים", "מים ממוחזרים לא מבוקרים", 2, 3)]


def lvl(v):
    return ("גבוה", RED_T) if v >= 10 else ("בינוני", AMBER_T) if v >= 6 else ("נמוך", GREEN_T)


rows = [["#", "חומר גלם", "סיכון", "הסתברות", "השפעה", "ציון", "רמה"]]
for k, (m_, r_, p_, i_) in enumerate(risks):
    rows.append([str(k + 1), m_, r_, str(p_), str(i_), str(p_ * i_), lvl(p_ * i_)[0]])
table(s, 0.9, 1.2, 8.4, rows, [0.45, 1.35, 2.75, 1.05, 0.95, 0.75, 1.0], size=13, row_h=0.5,
      align=["c", "r", "r", "c", "c", "c", "c"], bold_first=True,
      cell_fill=lambda i, j: lvl(risks[i - 1][2] * risks[i - 1][3])[1] if j in (5, 6) else None)
caption(s, 0.9, 5.3, 8.4, "סולם 1-5. דוגמה — יש לכייל את הציונים לפי נתוני המפעל ולעדכן אחת לרבעון")
# heat-map: impact grows to the left (RTL), probability grows upwards
hx, hy, cs = 9.75, 1.65, 0.52
text(s, hx, 1.2, 5 * cs, 0.35, "הסתברות ↑   השפעה ←", size=12, color=MUTED, align="c")
for pi in range(5):
    for ii in range(5):
        v = (5 - pi) * (ii + 1)
        col = "F4B7B7" if v >= 10 else "FFD99A" if v >= 6 else "BFE3C2"
        box(s, hx + (4 - ii) * cs, hy + pi * cs, cs - 0.03, cs - 0.03, fill=col, shape=MSO_SHAPE.RECTANGLE)
cells = {}
for k, (m_, r_, p_, i_) in enumerate(risks):
    cells.setdefault((p_, i_), []).append(k + 1)
for (p_, i_), ids in cells.items():
    x0_ = hx + (5 - i_) * cs
    y0_ = hy + (5 - p_) * cs
    for j, n in enumerate(ids):
        off = (j - (len(ids) - 1) / 2) * 0.2
        badge(s, n, x0_ + cs / 2 - 0.015 + off, y0_ + cs / 2 - 0.015, 0.24, fill=NAVY, size=9)
text(s, 9.55, 4.4, 3.0, 0.7, "מתחילים מהתאים האדומים: שם נמצא רוב הסיכון", size=13, color=NAVY, bold=True,
     align="c")

# ================================================================ Section 9
divider(9, "חידון, תקנים וסיכום", ["5 שאלות לבדיקת הבנה", "מפת התקנים", "מסרים מרכזיים"])

quiz = [("מהו החומר הקושר בבטון?", ["אגרגט", "צמנט", "מים", "מוסף"]),
        ("כמה אחוז מנפח הבטון הם אגרגטים?", ["10%-20%", "30%-40%", "50%-60%", "70%-80%"]),
        ("מהו C-S-H?", ["סוג של מוסף", "תוצר ההידרציה העיקרי, שאחראי לחוזק", "סוג של צמנט", "בדיקת חוזק"]),
        ("מה קורה כאשר יחס מים-צמנט עולה?", ["החוזק עולה", "החדירות יורדת", "החוזק יורד והחדירות עולה",
                                               "אין השפעה"]),
        ("איזו בדיקה מבוצעת בבטון טרי?", ["קרוטים", "שקיעה", "LA Abrasion", "לחיצת גלילים בגיל 28"])]
for qi, (q, opts) in enumerate(quiz):
    s = content_slide(f"חידון {qi + 1}")
    box(s, 0.9, 1.25, 11.65, 1.55, fill=NAVY)
    icon(s, "FaQuestion", 11.75, 2.02, 1.0, fill=LIME, color="n")
    text(s, 1.2, 1.3, 9.9, 1.45, q, size=30, bold=True, color=WHITE, anchor="m")
    for k, o in enumerate(opts):
        col_, row_ = k % 2, k // 2
        x = 6.85 - col_ * 5.95
        y = 3.1 + row_ * 1.35
        box(s, x, y, 5.7, 1.1, fill=TINT)
        badge(s, "אבגד"[k], x + 5.2, y + 0.55, 0.65, fill=BLUE, size=20)
        text(s, x + 0.25, y, 4.5, 1.1, o, size=20, color=NAVY, anchor="m")

# ---------------------------------------------------------------- Standards overview
s = content_slide("תקנים: תמונת מצב")
regs = [("FaStarOfDavid", "ישראל", "מכון התקנים", ["ת\"י 1 — צמנט", "ת\"י 3 — אגרגטים", "ת\"י 26 — שיטות בדיקה",
                                                  "ת\"י 118 — בטון: דרישות", "ת\"י 466 — חוקת הבטון",
                                                  "ת\"י 601 — בטון מובא", "ת\"י 896 — מוספים"], NAVY),
        ("FaGlobeEurope", "אירופה", "CEN", ["EN 197-1 — צמנט", "EN 206 — בטון", "EN 12350 — בדיקות בטון טרי",
                                            "EN 12390 — בדיקות בטון קשוח", "EN 12620 — אגרגטים", "EN 934 — מוספים"], BLUE),
        ("FaFlagUsa", "ארה\"ב", "ASTM / ACI", ["ASTM C33 — אגרגטים", "ASTM C39 — לחיצת גלילים",
                                               "ASTM C143 — שקיעה", "ASTM C494 — מוספים", "ACI 318 / 211 — תכן"], "5F6B76")]
for i, (ic, t1, org, items, col) in enumerate(regs):
    x = 12.55 - (i + 1) * 3.88 + 0.08
    box(s, x, 1.2, 3.8, 4.35, fill=TINT)
    r = box(s, x, 1.2, 3.8, 1.0, fill=col, radius=0.15)
    icon(s, ic, x + 3.25, 1.7, 0.6, fill=WHITE, color="n" if col != BLUE else "b")
    text(s, x + 0.2, 1.27, 2.6, 0.5, t1, size=22, bold=True, color=WHITE)
    text(s, x + 0.2, 1.75, 2.6, 0.35, org, size=13, color=WHITE)
    text(s, x + 0.25, 2.4, 3.35, 3.1, [{"t": it, "bullet": True} for it in items], size=13, space_after=3)
message(s, "התקינה הישראלית מתבססת יותר ויותר על התקינה האירופית; ASTM שכיח במפרטים בינלאומיים",
        y=5.75, h=0.7, ic="FaBook")

# ---------------------------------------------------------------- Standards appendix (2 slides)
std_il = [["תקן", "נושא", "מטרה", "תחום", "רלוונטי ל-"],
          ["ת\"י 1", "צמנט", "הרכב, סוגים ודרגות חוזק", "ייצור ואספקת צמנט", "איכות, רכש, מעבדה"],
          ["ת\"י 3", "אגרגטים לבטון", "דרישות לאגרגט מאבן טבעית", "מחצבות ומפעלי אגרגט", "מחצבות, איכות, מעבדה"],
          ["ת\"י 26", "שיטות בדיקה לבטון", "נוהלי דגימה ובדיקה אחידים", "בטון טרי וקשוח", "מעבדה, טכנולוגים"],
          ["ת\"י 118", "בטון: דרישות כלליות", "דרגות חוזק, חשיפה והתאמה", "בטון בכל יישום", "טכנולוגים, מהנדסים"],
          ["ת\"י 466", "חוקת הבטון", "תכן מבני וכללי ביצוע", "מבני בטון", "מהנדסים, מנהלי אזורים"],
          ["ת\"י 601", "בטון מובא", "ייצור, אספקה ובקרה", "מפעלי בטון מוכן", "מנהלי מפעלים, איכות"],
          ["ת\"י 896", "מוספים לבטון", "דרישות וסימון מוספים", "מוספים כימיים", "רכש, מעבדה, טכנולוגים"]]
std_int = [["תקן", "נושא", "מטרה", "תחום", "רלוונטי ל-"],
           ["EN 206", "בטון: מפרט, ביצועים, ייצור", "דרגות, חשיפה, קריטריוני התאמה", "אירופה", "טכנולוגים, איכות"],
           ["EN 12390", "בדיקות בטון קשוח", "הכנה, אשפרה ולחיצה של דגימות", "מעבדות", "מעבדה"],
           ["EN 12620", "אגרגטים לבטון", "תכונות ודרישות לאגרגט", "ספקי אגרגט", "מחצבות, איכות"],
           ["ASTM C33", "אגרגטים לבטון", "גרדציה ואיכות אגרגטים", "פרויקטים לפי ASTM", "מעבדה, רכש"],
           ["ASTM C39", "לחיצת גלילים", "שיטת בדיקת החוזק", "מעבדות", "מעבדה"],
           ["ASTM C143", "שקיעה", "שיטת בדיקת העבידות", "אתר ומפעל", "טכנאים, איכות"],
           ["ASTM C494", "מוספים כימיים", "סוגי מוספים (A-G) ודרישות", "ספקי מוספים", "טכנולוגים, רכש"]]
for ttl, rows in (("נספח תקנים א': תקינה ישראלית", std_il), ("נספח תקנים ב': תקינה בינלאומית", std_int)):
    s = content_slide(ttl)
    table(s, 0.9, 1.15, 11.65, rows, [1.35, 2.5, 3.1, 2.3, 2.4], size=13, row_h=0.56, header_h=0.5,
          cell_fill=lambda i, j: TINT if j == 0 else None)
    caption(s, 0.9, 5.75, 9.0, "יש לוודא תמיד את המהדורה העדכנית של כל תקן באתר מכון התקנים / הגוף המפרסם")

# ---------------------------------------------------------------- Summary
s = content_slide("סיכום: 5 מסרים מרכזיים")
msgs = [("FaCubes", "איכות מתחילה בחומרי הגלם"), ("FaTint", "W/C הוא הפרמטר הקריטי ביותר"),
        ("FaClipboardCheck", "בקרת איכות מונעת כשלים"), ("FaDollarSign", "זיהוי מוקדם חוסך כסף"),
        ("FaUsers", "איכות היא אחריות של כולם")]
for i, (ic, t1) in enumerate(msgs):
    y = 1.2 + i * 0.95
    box(s, 2.5, y, 10.05, 0.8, fill=NAVY if i == 1 else TINT)
    badge(s, i + 1, 12.05, y + 0.4, 0.58, fill=LIME, color=NAVY, size=20)
    icon(s, ic, 3.05, y + 0.4, 0.58, fill=BLUE)
    text(s, 3.6, y, 7.9, 0.8, t1, size=22, bold=True, color=WHITE if i == 1 else NAVY, anchor="m")
icon(s, "FaGraduationCap", 1.45, 3.1, 1.1, fill=NAVY)

# ---------------------------------------------------------------- Thanks
s = clone(TPL[7])
t = find(s, "TextBox 4")
t.left, t.width = I(3.67), I(6.0)
retext(t, "תודה", size=32, align="ctr")
text(s, 3.67, 4.35, 6.0, 0.6, "שאלות?", size=26, color=NAVY, align="c")

# ---------------------------------------------------------------- drop the template's sample slides
sldIdLst = prs.slides._sldIdLst
for sid in list(sldIdLst)[:8]:
    prs.part.drop_rel(sid.get(qn("r:id")))
    sldIdLst.remove(sid)

prs.save(OUT)
print("slides:", len(prs.slides), "->", OUT)
