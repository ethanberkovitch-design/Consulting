"""Shared toolkit for the training decks built on the corporate template.

Imported by build.py (basic course) and advanced/src/build_adv.py; both take
<template.pptx> <assets_dir> <out.pptx> on the command line.
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


def verify(s, x, y, w=1.75, t="לאימות מול התקן"):
    """Marks values taken from common practice rather than the standard's text."""
    r = box(s, x, y, w, 0.32, fill=AMBER_T, line=AMBER, lw=1, radius=0.5)
    shape_text(r, t, size=11, color=AMBER, margin=0.02)


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



def finish():
    """Drop the template's eight sample slides and save."""
    sldIdLst = prs.slides._sldIdLst
    for sid in list(sldIdLst)[:8]:
        prs.part.drop_rel(sid.get(qn("r:id")))
        sldIdLst.remove(sid)
    prs.save(OUT)
    print("slides:", len(prs.slides), "->", OUT)
