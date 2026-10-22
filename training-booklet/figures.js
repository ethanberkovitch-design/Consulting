// Flat vector illustrations for the booklet, as inline SVG strings.
// Every figure is self-contained (own viewBox, no external refs) so the same
// string can go into the HTML/PDF and be rasterised to PNG for the Word file.

const C = {
  ink: '#2B3440', navy: '#1F3A5F', orange: '#E8772E', grey: '#9AA5B1', light: '#EEF1F4',
  concrete: '#B8C0C8', sand: '#E2C27A', gravel: '#A88A64', water: '#4A90D9', waterL: '#CFE3F7',
  green: '#2E9E5B', greenL: '#DDF2E5', red: '#D64545', redL: '#FBE1E1', yellow: '#F2B705', yellowL: '#FFF4D6',
  teal: '#2E8C83', purple: '#7B4FA0', white: '#FFFFFF',
};
const FONT = `Heebo, Arial, sans-serif`;

const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" font-family="${FONT}">
<defs>
  <marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${C.ink}"/></marker>
  <marker id="ahO" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${C.orange}"/></marker>
  <marker id="ahB" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${C.water}"/></marker>
</defs>${body}</svg>`;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
// Hebrew labels: rtl direction keeps numbers and punctuation in the right order.
const t = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.size || 15}" font-weight="${o.w || 400}" fill="${o.fill || C.ink}" text-anchor="${o.a || 'middle'}" direction="rtl">${esc(s)}</text>`;
const tl = (x, y, lines, o = {}) => lines.map((s, i) => t(x, y + i * (o.lh || (o.size || 15) * 1.3), s, o)).join('');
const rect = (x, y, w, h, fill, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx ?? 8}" fill="${fill}" stroke="${o.stroke || C.ink}" stroke-width="${o.sw ?? 2}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
const circ = (x, y, r, fill, o = {}) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${o.stroke || C.ink}" stroke-width="${o.sw ?? 2}"/>`;
const line = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.c || C.ink}" stroke-width="${o.sw || 2.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.m ? ` marker-end="url(#${o.m})"` : ''} stroke-linecap="round"/>`;
const path = (d, fill, o = {}) => `<path d="${d}" fill="${fill}" stroke="${o.stroke || C.ink}" stroke-width="${o.sw ?? 2}" stroke-linejoin="round"/>`;
const g = (x, y, body, s = 1) => `<g transform="translate(${x},${y}) scale(${s})">${body}</g>`;

// ── Icons, drawn around (0,0) roughly 80×80 ──
const I = {
  bag: () => path('M-28,-30 L28,-30 L32,34 L-32,34 Z', '#D9DEE3') + rect(-20, -10, 40, 22, C.white, { rx: 3, sw: 1.5 }) + t(0, 6, 'צמנט', { size: 11, w: 700 }),
  drop: () => path('M0,-36 C14,-14 26,0 26,14 A26,26 0 0 1 -26,14 C-26,0 -14,-14 0,-36 Z', C.water) + path('M-10,10 A12,12 0 0 0 2,24', 'none', { stroke: C.white, sw: 3 }),
  pile: (c = C.gravel) => path('M-38,32 L-4,-26 Q0,-32 4,-26 L38,32 Z', c) + [[-12, 14], [6, 4], [14, 22], [-2, 24], [-20, 26], [0, -8], [22, 28]].map(([x, y]) => circ(x, y, 3.5, '#8A6E4C', { sw: 1 })).join(''),
  bottle: () => rect(-8, -38, 16, 12, C.ink, { rx: 2 }) + path('M-22,-26 L22,-26 L22,34 L-22,34 Z', C.teal) + rect(-15, -6, 30, 22, C.white, { rx: 3, sw: 1.5 }) + t(0, 9, 'מוסף', { size: 10, w: 700 }),
  truck: (drum = C.orange) => rect(-58, 6, 92, 14, C.grey, { rx: 3 }) + path('M34,-22 L56,-22 L64,-4 L64,20 L34,20 Z', C.white) + rect(42, -16, 14, 10, C.waterL, { rx: 2, sw: 1.5 }) +
    `<ellipse cx="-14" cy="-12" rx="40" ry="22" transform="rotate(-12 -14 -12)" fill="${drum}" stroke="${C.ink}" stroke-width="2"/>` + line(-44, -10, 14, -24, { sw: 2, c: C.white }) + line(-38, 0, 18, -12, { sw: 2, c: C.white }) +
    circ(-40, 24, 9, C.ink) + circ(-16, 24, 9, C.ink) + circ(48, 24, 9, C.ink) + circ(-40, 24, 3, C.grey, { sw: 0 }) + circ(-16, 24, 3, C.grey, { sw: 0 }) + circ(48, 24, 3, C.grey, { sw: 0 }),
  building: () => rect(-30, -40, 60, 76, C.concrete) + [-24, -6, 12].map((y) => [-20, 2].map((x) => rect(x, y, 16, 12, C.waterL, { rx: 1, sw: 1.5 })).join('')).join('') + rect(-8, 18, 16, 18, C.ink, { rx: 1, sw: 0 }) + line(-38, 36, 38, 36),
  quarry: () => path('M-40,34 L-40,-6 L-24,-6 L-24,-20 L-6,-20 L-6,-34 L40,-34 L40,34 Z', '#C9A57A') + line(-40, -6, -24, -6, { sw: 1.5 }) + path('M14,-48 L18,-40 L26,-44 L22,-36 L30,-32 L20,-30 L22,-22 L14,-28 L8,-22 L8,-30 L0,-32 L8,-36 L4,-44 L12,-40 Z', C.yellow, { sw: 1.5 }),
  crusher: () => path('M-30,-34 L30,-34 L16,0 L-16,0 Z', C.grey) + rect(-22, 0, 44, 30, C.navy) + line(-10, 6, -10, 24, { c: C.white, sw: 2 }) + line(10, 6, 10, 24, { c: C.white, sw: 2 }) + [-14, 0, 14].map((x) => circ(x, -22, 5, C.gravel, { sw: 1.5 })).join(''),
  piles3: () => g(-26, 6, I.pile(C.sand), 0.55) + g(0, 4, I.pile(C.gravel), 0.65) + g(26, 6, I.pile('#C4A27A'), 0.55),
  plant: () => rect(-34, -40, 22, 50, C.concrete, { rx: 4 }) + path('M-34,10 L-23,24 L-12,10', C.concrete) + rect(-6, -18, 40, 30, C.light) + rect(-2, 12, 32, 16, C.orange, { rx: 4 }) + line(-40, 36, 40, 36) + line(-30, 24, -30, 36, { sw: 2 }) + line(30, 28, 30, 36, { sw: 2 }),
  check: (c = C.green) => circ(0, 0, 16, c, { stroke: c }) + path('M-7,0 L-2,6 L8,-6', 'none', { stroke: C.white, sw: 3.5 }),
  cross: () => circ(0, 0, 16, C.red, { stroke: C.red }) + line(-6, -6, 6, 6, { c: C.white, sw: 3.5 }) + line(6, -6, -6, 6, { c: C.white, sw: 3.5 }),
  bulb: () => circ(0, -6, 16, C.yellow) + rect(-7, 10, 14, 10, C.grey, { rx: 2 }) + line(-6, -6, 0, 2, { sw: 2 }) + line(6, -6, 0, 2, { sw: 2 }),
  warn: () => path('M0,-20 L20,16 L-20,16 Z', C.orange) + rect(-2, -8, 4, 13, C.ink, { rx: 1, sw: 0 }) + circ(0, 10, 2.4, C.ink, { sw: 0 }),
  person: (c = C.orange) => circ(0, -30, 9, '#F2CDA5') + path('M-11,-31 A11,11 0 0 1 11,-31 L13,-29 L-13,-29 Z', C.yellow, { sw: 1.5 }) + path('M-14,-18 L14,-18 L12,14 L-12,14 Z', c) + line(-6, 14, -7, 36, { sw: 5 }) + line(6, 14, 7, 36, { sw: 5 }),
};

const ok = (x, y) => g(x, y, I.check());
const no = (x, y) => g(x, y, I.cross());
const badge = (x, y, n, c = C.orange) => circ(x, y, 15, c, { stroke: c }) + t(x, y + 5.5, n, { size: 15, w: 800, fill: C.white });

// Arrow pointing right-to-left (reading direction).
const arrowL = (x1, x2, y, c) => line(x1, y, x2, y, { m: c === C.orange ? 'ahO' : 'ah', c: c || C.ink });

const F = {};

F.legend = () => svg(680, 120, [
  [600, 'bulb', 'טיפ', 'שימושי לדעת'], [440, 'warn', 'זהירות', 'כלל שאסור לפספס'], [280, 'check', 'נכון', 'ככה עושים'], [120, 'cross', 'לא נכון', 'ככה לא עושים'],
].map(([x, ic, a, b]) => g(x, 40, I[ic]()) + t(x, 86, a, { w: 700, size: 16 }) + t(x, 106, b, { size: 13, fill: C.grey })).join(''));

F.month = () => {
  const w = [
    ['שבוע 1', 'היכרות', ['סיור במפעל', 'הדרכת בטיחות', 'פרקים 1 ו-2']],
    ['שבוע 2', 'לומדים', ['עבודה לצד החונך', 'הפרקים של התפקיד']],
    ['שבוע 3', 'מתרגלים', ['עבודה בעמדה', 'בהשגחת החונך']],
    ['שבוע 4', 'עצמאות', ['שאלות "בדקו את עצמכם"', 'חתימה על טופס ההדרכה']],
  ];
  return svg(680, 190, line(40, 52, 640, 52, { c: C.grey, sw: 4 }) + w.map(([a, b, l], i) => {
    const x = 590 - i * 170;
    return circ(x, 52, 22, i === 3 ? C.green : C.orange, { stroke: C.white, sw: 4 }) + t(x, 58, String(i + 1), { size: 18, w: 800, fill: C.white }) +
      t(x, 100, a, { size: 15, w: 800, fill: C.navy }) + t(x, 120, b, { size: 14, w: 700, fill: i === 3 ? C.green : C.orange }) + tl(x, 145, l, { size: 12.5, lh: 17 });
  }).join(''));
};

F.recipe = () => {
  const items = [
    ['bag', 'צמנט', '300–400 ק"ג', C.grey], ['drop', 'מים', '160–190 ליטר', C.water],
    ['pile', 'חול וחצץ', 'כ-1,800–1,900 ק"ג', C.gravel], ['bottle', 'מוספים', '2–5 ליטר', C.teal],
  ];
  return svg(680, 230, items.map(([ic, a, b, c], i) => {
    const x = 615 - i * 118;
    return g(x, 70, I[ic]()) + t(x, 140, a, { w: 800, size: 16 }) + t(x, 160, b, { size: 13, fill: C.ink }) + (i < 3 ? t(x - 59, 78, '+', { size: 30, w: 800, fill: C.grey }) : '');
  }).join('') + t(150, 78, '=', { size: 34, w: 800, fill: C.grey }) + g(70, 70, I.truck(), 0.95) + t(70, 140, 'קוב בטון', { w: 800, size: 16 }) + t(70, 160, 'כ-2.4 טון', { size: 13 }) +
    rect(160, 186, 360, 32, C.light, { sw: 0 }) + t(340, 207, 'החצץ והחול תופסים כ-75% מהנפח, הצמנט כ-12%, המים כ-17%', { size: 12.5 }));
};

F.wc = () => {
  const cube = (x, holes, label, sub, strength, c) => {
    const pts = [[20, 30], [55, 70], [90, 40], [40, 100], [100, 95], [70, 120], [25, 130], [115, 60], [80, 20], [60, 45], [30, 75], [105, 125]];
    return g(x, 20, path('M0,30 L30,0 L160,0 L130,30 Z', '#CDD3D9') + path('M130,30 L160,0 L160,130 L130,160 Z', '#A9B2BB') + rect(0, 30, 130, 130, C.concrete, { rx: 0 }) +
      pts.slice(0, holes).map(([px, py]) => circ(px, py + 22, 4 + (holes > 6 ? 1.5 : 0), C.white, { sw: 1.2 })).join('') +
      t(65, 190, label, { w: 800, size: 16 }) + t(65, 210, sub, { size: 13, fill: C.grey }) +
      rect(180, 40, 26, 120, C.light, { rx: 4, sw: 1.5 }) + rect(180, 160 - strength, 26, strength, c, { rx: 4, sw: 1.5 }) + t(193, 180, 'חוזק', { size: 12 }));
  };
  return svg(680, 240, cube(380, 2, 'מים לפי המתכון', 'בטון צפוף', 112, C.green) + cube(60, 12, 'עם מים מיותרים', 'חורים זעירים', 70, C.red) +
    line(350, 120, 300, 120, { m: 'ahO', c: C.orange, sw: 3 }) + g(325, 92, I.drop(), 0.45));
};

F.journey = () => {
  const s = [['quarry', 'מחצבה'], ['crusher', 'מגרסה'], ['piles3', 'ערמות'], ['plant', 'מפעל בטון'], ['truck', 'מערבל'], ['building', 'אתר בנייה']];
  return svg(680, 150, s.map(([ic, l], i) => {
    const x = 625 - i * 114;
    return g(x, 58, I[ic](), ic === 'truck' ? 0.62 : 0.8) + t(x, 122, l, { w: 700, size: 14 }) + badge(x + 34, 14, String(i + 1), C.navy) + (i < 5 ? arrowL(x - 42, x - 72, 58, C.orange) : '');
  }).join(''));
};

F.slump = () => svg(680, 230,
  g(530, 0, path('M-30,40 L30,40 L55,170 L-55,170 Z', C.grey) + rect(-70, 170, 140, 8, C.ink, { rx: 2, sw: 0 }) + t(0, 205, '1. ממלאים את הקונוס', { w: 700, size: 14 })) +
  g(340, 0, path('M-30,10 L30,10 L55,140 L-55,140 Z', 'none', { stroke: C.grey, sw: 2, }).replace('stroke-width', 'stroke-dasharray="6 5" stroke-width') + path('M-55,170 L55,170 L45,95 Q0,80 -45,95 Z', C.concrete) + rect(-70, 170, 140, 8, C.ink, { rx: 2, sw: 0 }) + line(0, 2, 0, -20, { m: 'ah' }) + t(0, 205, '2. מרימים ישר למעלה', { w: 700, size: 14 })) +
  g(140, 0, path('M-30,40 L30,40 L55,170 L-55,170 Z', 'none', { stroke: C.grey }).replace('stroke-width', 'stroke-dasharray="6 5" stroke-width') + path('M-75,170 L75,170 L55,110 Q0,95 -55,110 Z', C.concrete) + rect(-85, 170, 170, 8, C.ink, { rx: 2, sw: 0 }) +
    line(100, 40, 100, 100, { c: C.orange, sw: 2.5, m: 'ahO' }) + line(100, 100, 100, 40, { c: C.orange, sw: 2.5, m: 'ahO' }) + line(60, 40, 110, 40, { c: C.orange, sw: 1.5, dash: '4 3' }) + line(50, 100, 110, 100, { c: C.orange, sw: 1.5, dash: '4 3' }) +
    t(100, 30, 'השקיעה', { size: 13, w: 700, fill: C.orange }) + t(0, 205, '3. מודדים כמה ירד', { w: 700, size: 14 })));

F.cube = () => svg(680, 220,
  g(340, 0, rect(-110, 10, 220, 26, C.navy) + rect(-110, 176, 220, 26, C.navy) + rect(-12, -10, 24, 22, C.grey, { rx: 2 }) + rect(-46, 76, 92, 100, C.concrete, { rx: 2 }) + path('M-46,76 L-30,60 L62,60 L46,76 Z', '#CDD3D9') + path('M46,76 L62,60 L62,160 L46,176 Z', '#A9B2BB') +
    line(-14, 92, 6, 130, { sw: 1.5 }) + line(6, 130, -6, 160, { sw: 1.5 }) + line(-130, 50, -130, 74, { m: 'ahO', c: C.orange, sw: 4 }) + line(130, 50, 130, 74, { m: 'ahO', c: C.orange, sw: 4 }) + line(-130, 190, -130, 166, { m: 'ahO', c: C.orange, sw: 4 }) + line(130, 190, 130, 166, { m: 'ahO', c: C.orange, sw: 4 }) +
    line(0, 44, 0, 74, { m: 'ahO', c: C.orange, sw: 4 })) +
  rect(500, 60, 160, 100, C.light, { sw: 0 }) + tl(580, 88, ['קובייה 10 או 15 ס"מ', 'נשמרת במים', 'נבדקת ב-7 וב-28 יום'], { size: 14, lh: 24 }) +
  rect(20, 60, 160, 100, C.yellowL, { sw: 0 }) + tl(100, 92, ['30 מגה-פסקל', '≈ 30 טון', 'על קובייה של 10 ס"מ'], { size: 14, lh: 24, w: 500 }));

F.plant = () => {
  const bins = [['חול', C.sand], ['עדש', '#C4A27A'], ['פוליה', C.gravel]];
  return svg(680, 300,
    bins.map(([l, c], i) => { const x = 470 + i * 64; return path(`M${x},40 L${x + 56},40 L${x + 56},110 L${x + 36},135 L${x + 20},135 L${x},110 Z`, c) + t(x + 28, 30, l, { size: 13, w: 700 }); }).join('') +
    t(565, 14, 'תאי אגרגטים', { size: 13, fill: C.grey }) + rect(440, 150, 230, 14, C.grey, { rx: 3 }) + t(555, 186, 'משקל ומסוע', { size: 13 }) +
    line(440, 157, 330, 105, { sw: 3, c: C.grey }) +
    rect(330, 20, 48, 120, C.concrete, { rx: 6 }) + path('M330,140 L354,170 L378,140', C.concrete) + t(354, 82, 'צמנט', { size: 12, w: 700 }) + t(354, 12, 'סילו', { size: 13, fill: C.grey }) +
    rect(270, 40, 46, 50, C.waterL, { rx: 6 }) + t(293, 70, 'מים', { size: 12, w: 700 }) + rect(220, 40, 40, 50, '#CFEDEA', { rx: 6 }) + t(240, 70, 'מוסף', { size: 12, w: 700 }) +
    line(354, 172, 300, 198, { sw: 2, m: 'ah' }) + line(293, 92, 285, 190, { sw: 2, m: 'ah' }) + line(240, 92, 265, 190, { sw: 2, m: 'ah' }) +
    rect(210, 196, 130, 40, C.orange, { rx: 10 }) + t(275, 222, 'מערבל', { size: 14, w: 800, fill: C.white }) + line(275, 238, 275, 252, { sw: 3, m: 'ah' }) +
    g(250, 270, I.truck(), 0.6) +
    rect(20, 150, 150, 90, C.light) + rect(40, 166, 64, 40, C.navy, { rx: 3 }) + rect(112, 170, 44, 34, C.waterL, { rx: 3, sw: 1.5 }) + t(95, 228, 'חדר בקרה (הבקר)', { size: 13, w: 700 }) +
    line(172, 190, 205, 212, { sw: 1.5, dash: '5 4', c: C.navy }));
};

F.ticket = () => {
  const f = [['מספר תעודה ותאריך', 'שעת טעינה'], ['לקוח ואתר', 'מספר משאית'], ['סוג בטון (למשל ב-30)', 'כמות בקוב'], ['דרגת סומך', 'גודל אגרגט מרבי'], ['סביבת חשיפה', 'סוג צמנט ומוספים'], ['חתימת לקוח', 'שעת סיום פריקה']];
  return svg(680, 270, rect(170, 10, 340, 250, C.white, { rx: 6 }) + rect(170, 10, 340, 40, C.navy, { rx: 6 }) + t(340, 37, 'תעודת משלוח', { size: 17, w: 800, fill: C.white }) +
    f.map(([a, b], i) => t(495, 78 + i * 32, a, { size: 13.5, a: 'start' }) + t(330, 78 + i * 32, b, { size: 13.5, a: 'start' }) + line(185, 86 + i * 32, 495, 86 + i * 32, { sw: 1, c: C.light })).join('') +
    t(600, 120, 'תעודת הזהות', { size: 15, w: 800, fill: C.orange }) + t(600, 140, 'של הבטון', { size: 15, w: 800, fill: C.orange }) + line(560, 150, 520, 160, { m: 'ahO', c: C.orange }));
};

F.clock = () => {
  const cx = 130, cy = 115, r = 80;
  const arc = (a) => [cx + r * Math.sin(a * Math.PI / 180), cy - r * Math.cos(a * Math.PI / 180)];
  const [ex, ey] = arc(270);
  const seg = [['ערבול', 5, C.orange], ['נסיעה לאתר', 35, C.navy], ['המתנה', 20, C.grey], ['פריקה ויציקה', 30, C.green]];
  let acc = 0;
  return svg(680, 230, circ(cx, cy, r + 8, C.white) + `<path d="M${cx},${cy} L${cx},${cy - r} A${r},${r} 0 1 1 ${ex},${ey} Z" fill="${C.yellowL}" stroke="none"/>` +
    [...Array(12)].map((_, i) => { const [x1, y1] = arc(i * 30); return line(cx + (x1 - cx) * 0.88, cy + (y1 - cy) * 0.88, x1, y1, { sw: 2 }); }).join('') +
    line(cx, cy, cx, cy - 60, { sw: 4 }) + line(cx, cy, cx - 55, cy, { sw: 4, c: C.orange }) + circ(cx, cy, 5, C.ink) + t(cx, cy + 40, '90 דק\'', { size: 22, w: 800, fill: C.orange }) +
    seg.map(([l, m, c]) => { const x = 640 - acc * 4.4; acc += m; return rect(x - m * 4.4, 90, m * 4.4, 36, c, { rx: 4, sw: 1.5 }) + t(x - m * 2.2, 150, l, { size: 13, w: 700 }) + t(x - m * 2.2, 80, `${m} דק'`, { size: 12, fill: C.grey }); }).join('') +
    t(470, 195, 'דוגמה. הנסיעה וההמתנה משתנות, הסכום לא עובר 90', { size: 12.5, fill: C.grey }));
};

F.quarry = () => {
  const s = [['quarry', 'חציבה ופיצוץ'], ['crusher', 'גריסה ראשונית'], ['screen', 'נפה: מפרידים לכלוך'], ['crusher', 'גריסה שנייה'], ['screen', 'נפות ושטיפה'], ['piles3', 'ערמות לפי גודל']];
  I.screen = () => path('M-36,-14 L36,-30 L36,-18 L-36,2 Z', C.grey) + path('M-36,8 L36,-8 L36,4 L-36,24 Z', C.grey) + [-24, -8, 8, 24].map((x) => circ(x, -14 - x * 0.2, 3, C.gravel, { sw: 1 })).join('') + line(-30, 24, -30, 36) + line(30, 4, 30, 36);
  return svg(680, 150, s.map(([ic, l], i) => {
    const x = 625 - i * 114;
    return g(x, 58, I[ic](), 0.78) + tl(x, 118, l.split(': '), { w: 700, size: 13, lh: 16 }) + badge(x + 34, 14, String(i + 1), C.gravel) + (i < 5 ? arrowL(x - 42, x - 72, 58, C.orange) : '');
  }).join(''));
};

F.sizes = () => {
  const p = [['חול', '0–4.75 מ"מ', 3, C.sand], ['שומשום', '2.36–4.75', 6, '#D4B48A'], ['עדש', '4.75–9.5', 10, '#C4A27A'], ['פוליה', '9.5–19', 17, C.gravel], ['אגוזית', '19–25', 24, '#8E7353']];
  return svg(680, 170, p.map(([n, s, r, c], i) => {
    const x = 610 - i * 135;
    const dots = r < 8 ? [...Array(r < 5 ? 18 : 8)].map((_, k) => circ(x - 22 + (k % 6) * 9, 60 + Math.floor(k / 6) * 9, r, c, { sw: 0.8 })).join('') : circ(x, 66, r, c) + (r > 12 ? circ(x - r - 8, 76, r * 0.6, c) : '');
    return dots + t(x, 120, n, { w: 800, size: 16 }) + t(x, 142, s, { size: 13, fill: C.grey });
  }).join('') + t(340, 165, 'השמות והגדלים בקירוב. הם משתנים בין מחצבות', { size: 12, fill: C.grey }));
};

F.stockpile = () => svg(680, 220,
  g(510, 20, rect(-150, 0, 300, 180, C.greenL, { sw: 0 }) + ok(120, 24) +
    path('M-130,150 L-110,100 L-30,100 L-10,150 Z', C.sand) + path('M-130,150 L-110,100 L-30,100 L-10,150 Z', 'none', { sw: 1 }) + line(-120, 125, -20, 125, { sw: 1 }) +
    rect(-4, 70, 8, 80, C.grey, { rx: 0 }) + path('M10,150 L30,100 L110,100 L130,150 Z', C.gravel) + line(20, 125, 120, 125, { sw: 1 }) +
    rect(-118, 56, 74, 28, C.white, { rx: 4 }) + t(-81, 75, 'חול · מאושר', { size: 12, w: 700, fill: C.green }) + rect(34, 56, 74, 28, C.white, { rx: 4 }) + t(71, 75, 'פוליה · מאושר', { size: 12, w: 700, fill: C.green }) +
    t(0, 172, 'שכבות נמוכות, הפרדה ושלט', { size: 14, w: 700 })) +
  g(170, 20, rect(-150, 0, 300, 180, C.redL, { sw: 0 }) + no(120, 24) +
    path('M-90,150 L-10,30 L70,150 Z', C.sand) + path('M20,150 L70,90 L130,150 Z', C.gravel) + [[-70, 145], [-50, 142], [50, 146], [-30, 140], [40, 140]].map(([x, y]) => circ(x, y, 6, C.gravel, { sw: 1 })).join('') +
    line(-10, 22, -10, 4, { m: 'ah' }) + t(0, 172, 'קונוס גבוה, ערבוב, בלי שלט', { size: 14, w: 700 })));

F.admix = () => {
  const s = [
    ['חומרי גלם', () => rect(-24, -30, 48, 60, '#E8E2D0') + t(0, 5, 'הסגר', { size: 11, w: 700, fill: C.red })],
    ['ערבול במכל', () => rect(-28, -34, 56, 62, C.light) + line(0, -46, 0, 10, { sw: 3 }) + line(-14, 10, 14, 10, { sw: 4 }) + path('M-28,0 Q0,10 28,0 L28,28 L-28,28 Z', '#9FD6CF', { sw: 0 })],
    ['דגימה למעבדה', () => path('M-8,-34 L8,-34 L8,-8 L26,28 L-26,28 L-8,-8 Z', C.white) + path('M-18,12 L18,12 L26,28 L-26,28 Z', C.teal, { sw: 0 })],
    ['שחרור', () => I.check()],
    ['אריזה ותווית', () => rect(-30, -32, 60, 62, C.white) + [-16, 0, 16].map((x) => line(x, -32, x, 30, { sw: 1.2, c: C.grey })).join('') + line(-30, -10, 30, -10, { sw: 1.2, c: C.grey }) + line(-30, 10, 30, 10, { sw: 1.2, c: C.grey }) + rect(-16, -6, 32, 18, C.yellowL, { rx: 2, sw: 1.5 })],
  ];
  return svg(680, 140, s.map(([l, f], i) => { const x = 610 - i * 135; return g(x, 55, f()) + t(x, 118, l, { w: 700, size: 14 }) + (i < 4 ? arrowL(x - 45, x - 88, 55, C.orange) : ''); }).join(''));
};

F.label = () => {
  const r = [['שם המוצר', 'מספר מנה'], ['תאריך ייצור', 'תאריך תפוגה'], ['כמות', 'סיווג סיכון'], ['הוראות אחסון', 'שם היצרן']];
  return svg(680, 210, rect(190, 10, 300, 190, C.white, { rx: 6 }) + rect(190, 10, 300, 40, C.teal, { rx: 6 }) + t(340, 37, 'מפלסטק 100 · מנה 26-0412', { size: 15, w: 800, fill: C.white }) +
    r.map(([a, b], i) => t(470, 80 + i * 32, '■ ' + a, { size: 14, a: 'start' }) + t(320, 80 + i * 32, '■ ' + b, { size: 14, a: 'start' })).join('') +
    g(560, 110, path('M0,-26 L24,16 L-24,16 Z', C.white, { stroke: C.red, sw: 4 }).replace('fill="#FFFFFF"', 'fill="#FFFFFF"') + t(0, 12, '!', { size: 22, w: 800 })) + t(560, 150, 'סימון סיכון', { size: 12, fill: C.grey }));
};

F.silo = () => svg(680, 260,
  rect(420, 20, 70, 170, C.concrete, { rx: 8 }) + path('M420,190 L455,225 L490,190', C.concrete) + rect(430, 70, 50, 30, C.white, { rx: 4 }) + t(455, 90, 'CEM I', { size: 12, w: 800 }) + t(455, 14, 'סילו 2', { size: 13, fill: C.grey }) +
  rect(530, 20, 70, 170, C.concrete, { rx: 8 }) + path('M530,190 L565,225 L600,190', C.concrete) + rect(540, 70, 50, 30, C.white, { rx: 4 }) + t(565, 90, 'אפר פחם', { size: 11, w: 800 }) + t(565, 14, 'סילו 3', { size: 13, fill: C.grey }) +
  path('M120,170 L330,170 L330,140 L130,140 Z', C.light) + circ(160, 182, 12, C.ink) + circ(300, 182, 12, C.ink) + rect(330, 120, 50, 62, C.white, { rx: 6 }) +
  path('M150,140 Q240,70 410,60', 'none', { stroke: C.grey, sw: 6 }) + circ(410, 60, 6, C.grey) +
  rect(60, 40, 120, 70, C.white, { rx: 4 }) + t(120, 62, 'תעודה', { size: 12, fill: C.grey }) + t(120, 88, 'CEM I', { size: 15, w: 800 }) +
  path('M190,75 Q300,10 425,82', 'none', { stroke: C.orange, sw: 2.5, }).replace('stroke-width', 'stroke-dasharray="7 5" stroke-width') + g(310, 30, I.check(), 0.9) +
  t(340, 250, 'קוראים את התעודה ← קוראים את השלט ← משווים ← רק אז מחברים', { size: 14, w: 700, fill: C.navy }));

F.stopflow = () => {
  const s = [['עוצרים', 'את הפריקה או את השימוש', C.red], ['מסמנים', 'שלט "הסגר" על החומר', C.yellow], ['מדווחים', 'לבקר ולמנהל המפעל', C.navy]];
  return svg(680, 140, s.map(([a, b, c], i) => { const x = 570 - i * 230; return rect(x - 90, 20, 180, 90, C.white, { rx: 14, stroke: c, sw: 3 }) + circ(x + 70, 20, 16, c, { stroke: c }) + t(x + 70, 26, String(i + 1), { size: 16, w: 800, fill: i === 1 ? C.ink : C.white }) + t(x, 62, a, { size: 22, w: 800, fill: c === C.yellow ? '#A67C00' : c }) + t(x, 90, b, { size: 13 }) + (i < 2 ? arrowL(x - 98, x - 132, 65, C.ink) : ''); }).join(''));
};

F.recycle = () => svg(680, 290,
  g(600, 70, I.truck(), 0.7) + t(600, 120, 'שטיפת תופים', { size: 13, w: 700 }) + t(600, 138, 'ומשאבות', { size: 13, w: 700 }) + line(560, 80, 520, 80, { m: 'ahB', c: C.water, sw: 3 }) +
  rect(420, 50, 90, 70, C.light) + path('M430,70 L500,70 L490,105 L440,105 Z', C.grey) + tl(465, 140, ['מתקן מחזור', 'מפריד חול וחצץ'], { size: 12.5, w: 700, lh: 16 }) +
  line(465, 50, 465, 26, { sw: 2, m: 'ah' }) + g(465, 14, I.piles3(), 0.45) +
  line(415, 85, 385, 85, { m: 'ahB', c: C.water, sw: 3 }) +
  [0, 1, 2].map((i) => { const x = 300 - i * 85; return path(`M${x + 40},60 L${x + 34},110 L${x - 34},110 L${x - 40},60 Z`, C.waterL) + rect(x - 34, 96, 68, 14, '#9C8F80', { rx: 0, sw: 0 }) + (i < 2 ? line(x - 42, 70, x - 44 - 0, 70, { sw: 0 }) : ''); }).join('') +
  line(255, 66, 220, 66, { m: 'ahB', c: C.water, sw: 2 }) + line(170, 66, 135, 66, { m: 'ahB', c: C.water, sw: 2 }) +
  tl(215, 140, ['בריכות שיקוע', 'הבוץ שוקע, המים מתבהרים'], { size: 12.5, w: 700, lh: 16 }) +
  line(130, 80, 70, 80, { m: 'ahB', c: C.water, sw: 3 }) + t(55, 70, 'מים', { size: 12.5, w: 700 }) + t(55, 86, 'צלולים', { size: 12.5, w: 700 }) +
  // slurry branch
  line(465, 160, 465, 200, { m: 'ahB', c: C.water, sw: 3 }) + rect(400, 205, 130, 70, '#B9CFE0', { rx: 10 }) + line(465, 195, 465, 255, { sw: 3 }) + line(448, 255, 482, 255, { sw: 4 }) + path('M445,240 A20,10 0 1 0 485,240', 'none', { stroke: C.navy, sw: 2 }) +
  t(605, 230, 'מכל תרחיף', { size: 13, w: 700 }) + t(605, 248, 'עם ערבל שלא נעצר', { size: 12.5, fill: C.orange, w: 700 }) +
  line(395, 240, 270, 240, { m: 'ahB', c: C.water, sw: 3 }) + rect(200, 215, 66, 50, C.white, { rx: 8 }) + t(233, 238, '1.02', { size: 15, w: 800, fill: C.navy }) + t(233, 256, 'מד צפיפות', { size: 10.5 }) +
  line(195, 240, 140, 240, { m: 'ahB', c: C.water, sw: 3 }) + g(90, 235, I.plant(), 0.7) + t(90, 284, 'למערבל המפעל', { size: 12.5, w: 700 }) + line(55, 95, 75, 205, { m: 'ahB', c: C.water, sw: 2.5 }));

F.density = () => {
  const s = [['ממלאים כלי של ליטר', () => rect(-26, -30, 52, 60, '#B9CFE0') + line(-26, -18, 26, -18, { sw: 1.5, dash: '4 3' }) + t(0, 8, '1 ליטר', { size: 12, w: 700 })],
    ['מנקים מבחוץ', () => rect(-26, -30, 52, 60, '#B9CFE0') + path('M30,-10 L48,-24 L52,-18 L34,-4 Z', C.yellow)],
    ['שוקלים ומורידים את משקל הכלי', () => rect(-40, 10, 80, 18, C.grey, { rx: 4 }) + rect(-22, -34, 44, 44, '#B9CFE0') + rect(-26, 30, 52, 16, C.navy, { rx: 3 }) + t(0, 42, '1.025', { size: 11, w: 800, fill: C.white })],
    ['רושמים ומזינים לבקר', () => rect(-28, -34, 56, 70, C.white, { rx: 4 }) + [-18, -6, 6, 18].map((y) => line(-18, y, 18, y, { sw: 1.5, c: C.grey })).join('')],
  ];
  return svg(680, 140, s.map(([l, f], i) => { const x = 600 - i * 170; return g(x, 55, f()) + badge(x + 40, 18, String(i + 1), C.water) + t(x, 125, l, { w: 700, size: 13 }) + (i < 3 ? arrowL(x - 55, x - 115, 55) : ''); }).join(''));
};

F.gauge = () => {
  const z = [['1.000–1.010', 'עד 19 גרם/ליטר', 'שימוש רגיל', C.green], ['1.010–1.030', '19–57', 'תיקון אוטומטי במחשב', '#9CC44A'], ['1.030–1.050', '57–95', 'הטכנולוג מקטין את השיעור', C.yellow], ['מעל 1.050', 'מעל 95', 'עוצרים ומדווחים', C.red]];
  return svg(680, 170, z.map(([a, b, c, col], i) => { const x = 660 - (i + 1) * 160; return rect(x, 40, 160, 34, col, { rx: i === 0 || i === 3 ? 10 : 0, sw: 1.5 }) + t(x + 80, 30, a, { size: 14, w: 800 }) + t(x + 80, 63, b, { size: 12.5, w: 700, fill: i === 2 ? C.ink : C.white }) + tl(x + 80, 100, c.split(' ').length > 3 ? [c.split(' ').slice(0, 2).join(' '), c.split(' ').slice(2).join(' ')] : [c], { size: 13.5, w: 700, lh: 18 }); }).join('') +
    t(340, 158, 'צפיפות (ק"ג לליטר) ← מוצקים במים ← מה עושים', { size: 12, fill: C.grey }));
};

F.decision = () => {
  const b = (x, y, w, s, c = C.light, tc = C.ink) => rect(x - w / 2, y - 20, w, 40, c, { rx: 10 }) + t(x, y + 5, s, { size: 13.5, w: 700, fill: tc });
  return svg(680, 330,
    b(340, 30, 230, 'קובייה נמוכה מהדרישה', C.redL) + line(340, 50, 340, 72, { m: 'ah' }) +
    b(340, 92, 260, 'בודקים נתונים: טעות? קובייה פגומה?') + line(420, 112, 540, 142, { m: 'ah' }) + line(260, 112, 160, 142, { m: 'ah' }) +
    b(560, 162, 200, 'נמצאה טעות בבדיקה', C.greenL) + t(560, 200, 'מתעדים וסוגרים', { size: 13, fill: C.green, w: 700 }) +
    b(160, 162, 220, 'אין טעות: מאתרים משלוחים') + line(160, 182, 160, 204, { m: 'ah' }) +
    b(160, 224, 250, 'מודיעים ללקוח, בודקים במבנה') + line(160, 244, 160, 266, { m: 'ah' }) +
    b(160, 290, 230, 'מהנדס המבנה מחליט', C.navy, C.white) +
    rect(330, 248, 330, 76, C.white, { rx: 10, dash: '5 4' }) + t(495, 274, 'אפשרויות ההחלטה:', { size: 13, w: 700 }) + t(495, 298, 'נשאר · נשאר בתנאים · חיזוק', { size: 13 }) + t(495, 316, 'תיקון · הריסה והחלפה', { size: 13 }) + line(278, 290, 326, 290, { sw: 1.5, dash: '4 3' }));
};

F.defects = () => {
  const panel = (x, title, body) => g(x, 10, rect(-100, 0, 200, 150, C.concrete, { rx: 6 }) + body + t(0, 178, title, { size: 14, w: 800 }));
  const holes = [[-50, 40], [-30, 60], [-10, 45], [-40, 85], [-15, 80], [10, 65], [-25, 105], [5, 100]].map(([x, y]) => circ(x, y, 8, C.gravel, { sw: 1.5 })).join('');
  return svg(680, 200,
    panel(560, 'כיסי חצץ', path('M-70,30 Q-20,20 30,40 Q40,80 20,120 Q-30,130 -70,110 Z', '#7D858E', { sw: 1.5 }) + holes) +
    panel(340, 'סדקים', path('M-80,20 L-50,50 L-60,80 L-20,100 L-30,130', 'none', { sw: 2.5 }) + path('M20,10 L40,40 L30,70 L60,90', 'none', { sw: 2 }) + path('M-50,50 L-10,40', 'none', { sw: 1.5 })) +
    panel(120, 'ברזל חשוף', path('M-80,60 Q0,40 80,70 L80,100 Q0,80 -80,100 Z', '#7D858E', { sw: 1.5 }) + line(-90, 72, 90, 76, { c: '#A0522D', sw: 7 }) + line(-90, 90, 90, 92, { c: '#A0522D', sw: 7 })));
};

F.listen = () => {
  const s = [['מקשיבים', 'עד הסוף, בלי להפריע'], ['רושמים', 'מי, איפה, מתי, מספר תעודה'], ['מאשרים', 'מי יחזור ומתי'], ['מעבירים', 'למנהל האיכות, באותו יום']];
  return svg(680, 130, s.map(([a, b], i) => { const x = 590 - i * 170; return circ(x, 45, 30, i === 3 ? C.purple : C.white, { stroke: C.purple, sw: 3 }) + t(x, 53, String(i + 1), { size: 22, w: 800, fill: i === 3 ? C.white : C.purple }) + t(x, 98, a, { size: 16, w: 800 }) + t(x, 118, b, { size: 12.5 }) + (i < 3 ? arrowL(x - 38, x - 130, 45, C.purple === C.orange ? C.orange : C.ink) : ''); }).join(''));
};

F.cycle = () => {
  const s = ['קליטה ורישום', 'סיווג', 'חקירה', 'תיקון ופעולה מתקנת', 'תשובה ללקוח', 'בדיקה שזה לא חוזר'];
  const cx = 340, cy = 150, R = 110;
  return svg(680, 300, circ(cx, cy, R, 'none', { stroke: C.light, sw: 18 }) + t(cx, cy - 4, 'מחזור', { size: 18, w: 800, fill: C.purple }) + t(cx, cy + 20, 'התלונה', { size: 18, w: 800, fill: C.purple }) +
    s.map((l, i) => { const a = (i * 60) * Math.PI / 180; const x = cx + R * Math.sin(a), y = cy - R * Math.cos(a); const w = l.length * 8.5 + 30; return rect(x - w / 2, y - 18, w, 36, C.white, { rx: 18, stroke: C.purple, sw: 2.5 }) + t(x, y + 5, l, { size: 13.5, w: 700 }); }).join(''));
};

F.walkaround = () => {
  const pts = [[430, 70, 'שמנים, נוזלים ודלק'], [600, 150, 'צמיגים ונזילות'], [520, 230, 'בלמים והגה'], [170, 40, 'צופר, זמזם, אורות'], [110, 120, 'מראות ומצלמה'], [80, 200, 'חגורה, מטף, מעקה'], [300, 250, 'כף, שיניים וצירים']];
  const loader = g(330, 140, path('M-110,10 L-110,-30 L-60,-30 L-50,-70 L10,-70 L20,-30 L60,-30 L70,10 Z', C.yellow) + rect(-48, -64, 50, 34, C.waterL, { rx: 3, sw: 1.5 }) +
    path('M70,-10 L120,-30 L130,10 L150,10 L150,40 L95,40 Z', C.grey) + circ(-70, 30, 30, C.ink) + circ(40, 30, 30, C.ink) + circ(-70, 30, 12, C.grey, { sw: 0 }) + circ(40, 30, 12, C.grey, { sw: 0 }), 0.9);
  return svg(680, 280, loader + pts.map(([x, y, l], i) => badge(x, y, String(i + 1), C.orange) + t(x, y + 32, l, { size: 13, w: 700 })).join(''));
};

F.blind = () => svg(680, 300,
  `<path d="M340,150 L340,290 L180,290 Z" fill="${C.redL}" stroke="${C.red}" stroke-width="2"/>` + `<path d="M340,150 L340,290 L500,290 Z" fill="${C.redL}" stroke="${C.red}" stroke-width="2"/>` +
  rect(250, 120, 180, 30, C.redL, { rx: 4, stroke: C.red }) + rect(250, 160, 180, 30, C.redL, { rx: 4, stroke: C.red }).replace('y="160"', 'y="160"') +
  rect(290, 70, 100, 150, C.yellow, { rx: 10 }) + rect(305, 100, 70, 40, C.waterL, { rx: 4, sw: 1.5 }) + rect(275, 20, 130, 40, C.grey, { rx: 6 }) + t(340, 46, 'כף', { size: 13, w: 700 }) +
  [[282, 90], [398, 90], [282, 200], [398, 200]].map(([x, y]) => rect(x - 8, y - 18, 16, 36, C.ink, { rx: 3, sw: 0 })).join('') +
  t(340, 280, 'מאחור: שטח מת גדול', { size: 14, w: 800, fill: C.red }) + t(205, 140, 'צד', { size: 13, w: 700, fill: C.red }) + t(475, 140, 'צד', { size: 13, w: 700, fill: C.red }) +
  g(110, 230, I.person(), 0.9) + g(560, 80, I.person(C.green), 0.9) + t(560, 135, 'כאן רואים אתכם', { size: 13, w: 700, fill: C.green }) + t(110, 280, 'כאן לא', { size: 13, w: 700, fill: C.red }));

F.bucket = () => {
  const ld = (x, y, by, extra = '') => g(x, y, path('M-70,0 L-70,-30 L-40,-30 L-34,-58 L10,-58 L16,-30 L40,-30 L46,0 Z', C.yellow) + rect(-30, -54, 34, 24, C.waterL, { rx: 3, sw: 1.5 }) +
    line(40, -20, 80, by - 10, { sw: 6, c: C.grey }) + path(`M74,${by - 20} L104,${by - 20} L110,${by + 10} L80,${by + 10} Z`, C.grey) + circ(-48, 8, 18, C.ink) + circ(24, 8, 18, C.ink) + line(-90, 26, 130, 26, { sw: 2, c: C.grey }) + extra, 0.9);
  return svg(680, 230,
    rect(460, 10, 210, 200, C.greenL, { sw: 0 }) + ld(545, 130, 6) + ok(645, 34) + line(660, 120, 660, 146, { c: C.green, sw: 2 }) + t(565, 190, 'נסיעה: כף נמוכה', { size: 14, w: 800 }) +
    rect(235, 10, 210, 200, C.redL, { sw: 0 }) + ld(320, 130, -70) + no(420, 34) + t(340, 190, 'לא נוסעים עם כף מורמת', { size: 14, w: 800 }) +
    rect(10, 10, 210, 200, C.greenL, { sw: 0 }) + ld(95, 130, 16) + ok(195, 34) + t(115, 172, 'חנייה: כף על הקרקע,', { size: 13, w: 700 }) + t(115, 192, 'בלם חנייה, מפתח בחוץ', { size: 13, w: 700 }));
};

F.three = () => svg(680, 230,
  rect(380, 20, 120, 190, C.yellow, { rx: 8 }) + rect(395, 34, 90, 70, C.waterL, { rx: 4, sw: 1.5 }) + line(375, 40, 375, 190, { sw: 5, c: C.grey }) + [140, 175, 205].map((y) => rect(340, y, 40, 8, C.grey, { rx: 2 })).join('') +
  g(345, 150, circ(-6, -60, 12, '#F2CDA5') + path('M-20,-46 L8,-46 L10,0 L-16,0 Z', C.orange) + line(4, -40, 28, -96, { sw: 5 }) + line(-14, -38, 28, -60, { sw: 5 }) + line(-6, 0, 0, 28, { sw: 6 }) + line(6, 0, 10, 34, { sw: 6 }) +
    circ(28, -96, 7, C.green, { stroke: C.green }) + circ(28, -60, 7, C.green, { stroke: C.green }) + circ(10, 30, 7, C.green, { stroke: C.green })) +
  tl(180, 80, ['פנים לכלי', 'שתי ידיים ורגל על הכלי', 'צעד אחר צעד, בלי לקפוץ'], { size: 15, w: 700, lh: 30 }) + g(560, 100, I.check(), 1.4));

F.books = () => {
  const b = (x, v, l, c) => rect(x - 55, 40, 110, 60, C.white, { rx: 10, stroke: c, sw: 3 }) + t(x, 76, v, { size: 20, w: 800, fill: c }) + t(x, 124, l, { size: 13, w: 700 });
  return svg(680, 150, b(600, '1,200', 'מלאי פתיחה', C.navy) + t(525, 78, '+', { size: 28, w: 800, fill: C.grey }) + b(450, '3,400', 'קבלות בחודש', C.green) + t(375, 78, '−', { size: 28, w: 800, fill: C.grey }) +
    b(300, '3,500', 'צריכה במחשב', C.orange) + t(225, 78, '=', { size: 28, w: 800, fill: C.grey }) + b(150, '1,100', 'אמור להיות (טון)', C.purple) + t(150, 145, 'משווים לספירה בפועל', { size: 12, fill: C.grey }));
};

F.measure = () => svg(680, 220,
  g(470, 0, path('M-150,170 L-80,60 L80,60 L150,170 Z', C.gravel) + `<path d="M-150,170 L-80,60 L80,60 L150,170" fill="none" stroke="${C.orange}" stroke-width="2" stroke-dasharray="6 5"/>` +
    g(0, 26, rect(-24, -8, 48, 16, C.ink, { rx: 4 }) + line(-24, 0, -40, -8, { sw: 2 }) + line(24, 0, 40, -8, { sw: 2 }) + circ(-40, -8, 6, C.grey) + circ(40, -8, 6, C.grey)) +
    t(0, 120, '2,000 קוב × 1.6 טון', { size: 15, w: 800, fill: C.white }) + t(0, 145, '= 3,200 טון', { size: 15, w: 800, fill: C.white }) + t(0, 200, 'ערמה: רחפן מודד נפח', { size: 14, w: 700 })) +
  g(150, 0, rect(-40, 20, 80, 150, C.white, { rx: 8 }) + rect(-40, 80, 80, 90, C.concrete, { rx: 0, sw: 0 }) + rect(-40, 20, 80, 150, 'none', { rx: 8 }) +
    line(56, 20, 56, 170, { sw: 1.5 }) + [20, 50, 80, 110, 140, 170].map((y) => line(50, y, 62, y, { sw: 1.5 })).join('') + line(-40, 80, 72, 80, { c: C.orange, sw: 2, dash: '5 3' }) + t(95, 85, '8.2 מ\'', { size: 12, w: 700, fill: C.orange }) +
    t(0, 200, 'סילו: גובה ← טבלה ← טונות', { size: 14, w: 700 })));

module.exports = { figures: F, C };
