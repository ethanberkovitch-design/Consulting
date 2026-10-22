// Builds the onboarding procedures booklet (Hebrew, RTL) from content.js.
// Run: node build.js  →  נהלי-הכשרה-עובדים-חדשים.docx
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType,
  ShadingType, BorderStyle, AlignmentType, LevelFormat, Header, Footer,
  PageNumber, HeadingLevel, VerticalAlign,
} = require('docx');
const procedures = require('./content');

const COMPANY = `סולל בונה`;
const EDITION = `מהדורה 1 · ${new Date().toISOString().slice(0, 10)}`;
const FONT = 'Arial';
const CONTENT_W = 9638; // A4 minus 2 cm margins, in DXA
const C = { navy: '1F3A5F', accent: 'C8102E', light: 'EAF0F7', amber: 'FFF4D6', grey: '666666', line: 'B7C4D4' };

const run = (text, o = {}) => new TextRun({ text, font: FONT, rightToLeft: true, size: o.size || 22, bold: o.bold, color: o.color, italics: o.italics });
const para = (text, o = {}) => new Paragraph({
  bidirectional: true,
  alignment: o.align,
  spacing: { before: o.before ?? 60, after: o.after ?? 100, line: 300 },
  heading: o.heading,
  keepNext: o.keepNext,
  children: Array.isArray(text) ? text : [run(text, o)],
});
const bullet = (text) => new Paragraph({
  bidirectional: true, numbering: { reference: 'bul', level: 0 },
  spacing: { after: 60, line: 290 }, children: [run(text)],
});
const h1 = (text) => para(text, { heading: HeadingLevel.HEADING_1, size: 32, bold: true, color: C.navy, before: 0, after: 200 });
const h2 = (text) => para(text, { heading: HeadingLevel.HEADING_2, size: 26, bold: true, color: C.navy, before: 240, after: 100, keepNext: true });
const h3 = (text) => para(text, { heading: HeadingLevel.HEADING_3, size: 23, bold: true, color: C.accent, before: 160, after: 60, keepNext: true });

const border = { style: BorderStyle.SINGLE, size: 4, color: C.line };
const borders = { top: border, bottom: border, left: border, right: border };
const cell = (text, width, o = {}) => new TableCell({
  width: { size: width, type: WidthType.DXA },
  borders,
  verticalAlign: VerticalAlign.CENTER,
  shading: o.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: o.fill } : undefined,
  margins: { top: 60, bottom: 60, left: 100, right: 100 },
  children: (Array.isArray(text) ? text : [text]).map((t) => para(t, { size: o.size || 20, bold: o.bold, color: o.color, before: 0, after: 0 })),
});
const table = (head, rows, widths) => {
  const total = widths.reduce((a, b) => a + b, 0);
  if (total !== CONTENT_W) throw new Error(`table widths sum to ${total}, expected ${CONTENT_W}: ${head.join('|')}`);
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: widths,
    visuallyRightToLeft: true,
    rows: [
      new TableRow({ tableHeader: true, children: head.map((h, i) => cell(h, widths[i], { fill: C.navy, bold: true, color: 'FFFFFF' })) }),
      ...rows.map((r, ri) => new TableRow({ cantSplit: true, children: r.map((v, i) => cell(v, widths[i], { fill: ri % 2 ? C.light : undefined, bold: i === 0 })) })),
    ],
  });
};
const box = (title, lines, fill) => new Table({
  width: { size: CONTENT_W, type: WidthType.DXA },
  columnWidths: [CONTENT_W],
  visuallyRightToLeft: true,
  rows: [new TableRow({ cantSplit: true, children: [new TableCell({
    width: { size: CONTENT_W, type: WidthType.DXA },
    borders: { top: { style: BorderStyle.SINGLE, size: 12, color: C.accent }, bottom: border, left: border, right: border },
    shading: { type: ShadingType.CLEAR, color: 'auto', fill },
    margins: { top: 100, bottom: 100, left: 160, right: 160 },
    children: [para(title, { bold: true, color: C.accent, size: 22, before: 0 }), ...lines],
  })] })],
});
const spacer = () => para('', { before: 0, after: 80 });

function renderItems(items) {
  const out = [];
  for (const it of items) {
    if (typeof it === 'string') out.push(para(it));
    else if (it.bullets) it.bullets.forEach((b) => out.push(bullet(b)));
    else if (it.table) { out.push(table(it.table.head, it.table.rows, it.table.widths), spacer()); }
    else if (it.note) { out.push(box(`שימו לב`, [para(it.note, { before: 0, after: 0 })], C.amber), spacer()); }
  }
  return out;
}

function procedureBody(p) {
  const s = [];
  s.push(para(`נוהל ${p.num}`, { size: 20, color: C.grey, before: 0, after: 0 }));
  s.push(h1(p.title));
  s.push(table(
    [`מספר נוהל`, `מהדורה`, `נכתב בידי`, `אושר בידי`],
    [[p.num, `1`, `מנהל האיכות`, `מנהל המפעל / סמנכ"ל תפעול`]],
    [2400, 2400, 2419, 2419],
  ));
  s.push(h2(`1. מטרה`), para(p.purpose));
  s.push(h2(`2. תחולה`), para(p.scope));
  s.push(h2(`3. מסמכים ישימים`), ...p.refs.map(bullet));
  s.push(h2(`4. הגדרות`), table([`מונח`, `הגדרה`], p.defs, [2600, 7038]));
  s.push(h2(`5. אחריות וסמכויות`), table([`בעל תפקיד`, `אחריות`], p.resp, [2600, 7038]));
  s.push(h2(`6. שיטת העבודה`));
  p.method.forEach((m, i) => { s.push(h3(`6.${i + 1} ${m.h}`), ...renderItems(m.items)); });
  s.push(h2(`7. טבלת בקרות`), table(p.controls.head, p.controls.rows, p.controls.widths));
  s.push(h2(`8. רשומות`), table([`רשומה`, `תקופת שמירה`], p.records.map((r) => [r, `7 שנים לפחות, או לפי דרישת חוזה או דין`]), [5638, 4000]));
  s.push(h2(`9. מה חשוב לזכור`), box(`לעובד בשטח ובייצור`, p.keyPoints.map(bullet), C.light));
  s.push(h2(`10. שאלות לבדיקת הבנה`), ...p.quiz.map((q, i) => para(`${i + 1}. ${q}`)));
  return s;
}

const header = (label) => new Header({ children: [new Paragraph({
  bidirectional: true,
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.navy, space: 4 } },
  children: [run(`${COMPANY} · תכנית הכשרה לעובדים חדשים · ${label}`, { size: 17, color: C.grey })],
})] });
const footer = new Footer({ children: [new Paragraph({
  bidirectional: true, alignment: AlignmentType.CENTER,
  children: [run(`${EDITION} · עמוד `, { size: 17, color: C.grey }), new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 17, color: C.grey }),
    run(` · עותק מודפס אינו מבוקר`, { size: 17, color: C.grey })],
})] });
const page = { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134, header: 567, footer: 567 } };
const section = (label, children) => ({ properties: { page }, headers: { default: header(label) }, footers: { default: footer }, children });

// ── Front matter ──
const cover = [
  para('', { before: 2400 }),
  para(COMPANY, { align: AlignmentType.CENTER, size: 30, bold: true, color: C.grey }),
  para(`נהלי עבודה`, { align: AlignmentType.CENTER, size: 56, bold: true, color: C.navy, before: 200 }),
  para(`לתכנית ההכשרה של עובדים חדשים`, { align: AlignmentType.CENTER, size: 34, color: C.navy }),
  para(`מפעלי בטון · מחצבות ומגרסות · מפעל מוספים`, { align: AlignmentType.CENTER, size: 24, color: C.accent, before: 300 }),
  para('', { before: 2400 }),
  para(EDITION, { align: AlignmentType.CENTER, size: 22, color: C.grey }),
  para(`טיוטה לאישור מנהל האיכות`, { align: AlignmentType.CENTER, size: 22, bold: true, color: C.accent }),
];

const intro = [
  h1(`מבוא ותכנית ההכשרה`),
  h2(`למי מיועדת החוברת`),
  para(`החוברת מרכזת תשעה נהלי ליבה שכל עובד חדש במערך הבטון והאגרגטים לומד בחודש הראשון שלו. כל נוהל בנוי במבנה אחיד לפי ISO 9001, ובסופו שני חלקים קצרים לעובד: "מה חשוב לזכור" ושאלות לבדיקת הבנה. מהנדסים ובעלי תפקידי בקרה לומדים את הנוהל כולו. עובדי ייצור ושטח לומדים את סעיף 6 הרלוונטי לתפקידם ואת סעיפים 9 ו-10.`),
  h2(`רשימת הנהלים`),
  table(
    [`מס'`, `נוהל`, `קהל יעד עיקרי`, `משך הדרכה`],
    [
      [`QA-01`, `תהליך ייצור הבטון, בקרת והבטחת איכות`, `בקרים, לבורנטים, טכנולוגים, נהגי מערבל, מוקד הזמנות`, `4 שעות + ליווי בעמדה`],
      [`QA-02`, `תהליך ייצור אגרגטים לבטון, בקרה והבטחת איכות`, `עובדי מחצבה ומגרסה, לבורנטים`, `3 שעות + סיור`],
      [`QA-03`, `תהליך ייצור מוספים לבטון, בקרה והבטחת איכות`, `עובדי מפעל המוספים, לבורנטים, טכנולוגים`, `3 שעות`],
      [`QA-04`, `קבלת חומרי גלם במפעל הבטון`, `שוקלים, בקרים, לבורנטים, טרקטוריסטים`, `2 שעות + תרגול`],
      [`QA-05`, `ניהול וטיפול בתלונת לקוח`, `כל העובדים; מורחב למכירות ולטכנולוגים`, `1.5 שעות`],
      [`QA-06`, `תיקון בטון והתאמה לדרישות`, `טכנולוגים, לבורנטים, בקרים, מנהלי מפעל`, `2 שעות`],
      [`QA-07`, `עבודת טרקטוריסט (מפעיל שופל)`, `מפעילי שופל וצמ"ה, מנהלי עבודה`, `2 שעות + בחינה מעשית`],
      [`QA-08`, `ספירת מלאי`, `מנהלי מפעל, בקרים, מחסנאים, בקרה כספית`, `1.5 שעות`],
      [`QA-09`, `בדיקה ושימוש במים ממוחזרים לייצור בטון`, `טכנולוגים, לבורנטים, בקרים, מפעילי מתקן מחזור`, `2 שעות + תרגול מדידת צפיפות`],
    ],
    [1000, 3438, 3400, 1800],
  ),
  h2(`מהלך ההכשרה`),
  bullet(`שבוע 1: נוהל QA-05 (לכל העובדים) ונוהל ליבה לתפקיד, בכיתה ובסיור במפעל.`),
  bullet(`שבועות 2 עד 3: ליווי חונך בעמדה, ותרגול רשימות תיוג וטפסים.`),
  bullet(`שבוע 4: מבחן הבנה בעל פה או בכתב לפי השאלות בסעיף 10, וחתימה על טופס אישור ההדרכה שבסוף החוברת.`),
  bullet(`רענון: אחת לשנה, ובכל שינוי מהותי בנוהל.`),
  spacer(),
  box(`הערה מקצועית לפני הפצה`, [
    para(`הנהלים נכתבו לפי דרישות התקנים הישראליים (ת"י 118, ת"י 3, ת"י 896, ת"י 1, ת"י 26), ISO 9001 ודיני הבטיחות בעבודה, ולפי הפרקטיקה המקובלת בחברות ביצוע ובמפעלי בטון גדולים בישראל. לפני הפצה צריך:`, { before: 0 }),
    bullet(`להשוות לנהלי מערכת האיכות הקיימים בחברה ולמספור הפנימי שלה, ולהתאים שמות תפקידים.`),
    bullet(`לוודא מול מכון התקנים שמהדורות התקנים עדכניות, ושהערכים המספריים (קריטריוני התאמה, סבולות, תדירויות) תואמים למהדורה התקפה ולתנאי היתר התו.`),
    bullet(`לאשר את ערכי ברירת המחדל שסומנו כ"לפי החלטת מנהל האיכות" (גבולות פערים בספירת מלאי, זמני תגובה לתלונות, מהירות נסיעה).`),
    bullet(`להעביר את נוהל QA-07 לאישור ממונה הבטיחות.`),
  ], C.amber),
];

const ackRows = procedures.map((p) => [p.num, p.title, '', '', '']);
const ack = [
  h1(`טופס אישור הדרכה`),
  para(`אני החתום מטה מאשר שקיבלתי הדרכה על הנהלים המסומנים, הבנתי אותם, קיבלתי הזדמנות לשאול שאלות, ואפעל לפיהם.`),
  table([`שם העובד`, `מספר עובד`, `תפקיד`, `מפעל`], [['', '', '', '']], [2400, 2400, 2419, 2419]),
  spacer(),
  table([`נוהל`, `שם הנוהל`, `תאריך`, `שם המדריך`, `חתימת העובד`], ackRows, [1000, 3838, 1400, 1700, 1700]),
  spacer(),
  para(`חתימת הממונה הישיר: ____________________      תאריך: ____________`, { before: 300 }),
];

const doc = new Document({
  creator: COMPANY,
  title: `נהלי עבודה לתכנית הכשרת עובדים חדשים`,
  styles: {
    default: { document: { run: { font: FONT, size: 22, rightToLeft: true } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', run: { font: FONT, size: 32, bold: true, color: C.navy }, paragraph: { outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', run: { font: FONT, size: 26, bold: true, color: C.navy }, paragraph: { outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', run: { font: FONT, size: 23, bold: true, color: C.accent }, paragraph: { outlineLevel: 2 } },
    ],
  },
  numbering: { config: [{ reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.START,
    style: { paragraph: { indent: { start: 540, hanging: 300 } }, run: { font: FONT } } }] }] },
  sections: [
    { properties: { page }, children: cover },
    section(`מבוא`, intro),
    ...procedures.map((p) => section(`נוהל ${p.num}`, procedureBody(p))),
    section(`אישור הדרכה`, ack),
  ],
});

const out = path.join(__dirname, 'נהלי-הכשרה-עובדים-חדשים.docx');
Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(out, buf); console.log('wrote', out); });
