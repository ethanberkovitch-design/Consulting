// Vector illustrations for the deck. Text inside the SVGs is limited to digits and
// Latin labels (librsvg has no Hebrew shaping); Hebrew labels live in the slides.

const H = {
  navy: "003973", navyMid: "1F5A94", navyLight: "DCE6F1", orange: "0081C8",
  orangeLight: "DCEFFA", lime: "C4D82E", limeDark: "8FA11A", blueGray: "A3B1BA", gray: "6B6B6B", paste: "B9BDC3", pasteDark: "9EA3AA",
  stone: "8C8478", stoneLight: "B5AC9E", stoneDark: "6E665B", water: "5DA9E9",
  waterLight: "CFE6FA", rust: "A0522D", white: "FFFFFF", ink: "1F2A37",
  red: "C62828", green: "2E7D32", clay: "9C6B3C", steel: "4A5563",
};

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function stonePath(cx, cy, r, R, rough = 0.28) {
  const n = 7 + Math.floor(R() * 4);
  const rot = R() * Math.PI * 2;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2;
    const rr = r * (1 - rough + R() * rough);
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr * 0.85).toFixed(1)}`);
  }
  return `M${pts.join("L")}Z`;
}

// Non-overlapping stones inside a box; returns [{cx,cy,r}]
function scatter(R, x, y, w, h, count, rMin, rMax, gap = 4, avoid = []) {
  const out = [];
  let tries = 0;
  while (out.length < count && tries < count * 400) {
    tries++;
    const r = rMin + R() * (rMax - rMin);
    const cx = x + r + R() * (w - 2 * r);
    const cy = y + r + R() * (h - 2 * r);
    const hit = [...out, ...avoid].some((s) => Math.hypot(s.cx - cx, s.cy - cy) < s.r + r + gap);
    if (!hit) out.push({ cx, cy, r });
  }
  return out;
}

function stones(R, list, fill = H.stone, stroke = H.stoneDark, sw = 2) {
  return list
    .map((s) => {
      const shade = [fill, H.stoneLight, fill, "9A9183"][Math.floor(R() * 4)];
      return `<path d="${stonePath(s.cx, s.cy, s.r, R)}" fill="#${shade}" stroke="#${stroke}" stroke-width="${sw}"/>`;
    })
    .join("");
}

function dots(R, x, y, w, h, n, rMin, rMax, fill, op = 1) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const r = rMin + R() * (rMax - rMin);
    s += `<circle cx="${(x + R() * w).toFixed(1)}" cy="${(y + R() * h).toFixed(1)}" r="${r.toFixed(1)}" fill="#${fill}" opacity="${op}"/>`;
  }
  return s;
}

const svg = (w, h, body, bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
  (bg ? `<rect width="${w}" height="${h}" fill="#${bg}"/>` : "") + body + `</svg>`;

const arrowHead = (id, color) =>
  `<marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" fill="#${color}"/></marker>`;

// ---------- Cover: wide skyline silhouette (plant, truck, crane, building) ----------
function skyline() {
  const W = 2600, Hh = 420, c = "#C9D3DC", d = "#A3B1BA";
  let b = `<rect x="0" y="404" width="${W}" height="16" fill="${d}"/>`;
  // batching plant
  for (const sx of [260, 360]) {
    b += `<rect x="${sx}" y="80" width="80" height="220" rx="8" fill="${c}"/><polygon points="${sx},300 ${sx + 80},300 ${sx + 52},350 ${sx + 28},350" fill="${c}"/>`;
    b += `<rect x="${sx + 6}" y="350" width="10" height="56" fill="${d}"/><rect x="${sx + 64}" y="350" width="10" height="56" fill="${d}"/>`;
  }
  b += `<rect x="460" y="190" width="150" height="150" fill="${d}"/><rect x="470" y="340" width="12" height="66" fill="${d}"/><rect x="590" y="340" width="12" height="66" fill="${d}"/>`;
  b += `<polygon points="600,200 820,390 840,375 620,185" fill="${c}"/>`;
  b += `<polygon points="790,406 830,360 880,406" fill="${d}"/>`;
  // mixer truck
  const tx = 950;
  b += `<rect x="${tx}" y="340" width="300" height="18" fill="${d}"/>`;
  b += `<g transform="rotate(-10 ${tx + 130} 300)"><ellipse cx="${tx + 130}" cy="300" rx="125" ry="50" fill="${c}"/>`;
  for (let i = 0; i < 4; i++) b += `<line x1="${tx + 50 + i * 50}" y1="255" x2="${tx + 25 + i * 50}" y2="345" stroke="#C4D82E" stroke-width="10"/>`;
  b += `</g><path d="M${tx + 270},340 L${tx + 270},270 L${tx + 330},270 L${tx + 355},310 L${tx + 355},358 L${tx + 270},358Z" fill="#0081C8"/>`;
  for (const wx of [tx + 50, tx + 120, tx + 315]) b += `<circle cx="${wx}" cy="375" r="26" fill="#003973"/>`;
  // building under construction + crane
  const bx = 1600;
  for (let f = 0; f < 5; f++) b += `<rect x="${bx}" y="${170 + f * 50}" width="420" height="10" fill="${d}"/>`;
  for (let k = 0; k < 6; k++) b += `<rect x="${bx + k * 80}" y="170" width="12" height="236" fill="${c}"/>`;
  b += `<rect x="2160" y="30" width="18" height="376" fill="${d}"/><rect x="1820" y="22" width="560" height="14" fill="${d}"/>`;
  b += `<polygon points="2155,22 2169,0 2183,22" fill="${d}"/><rect x="2330" y="36" width="40" height="30" fill="${d}"/>`;
  b += `<rect x="1898" y="36" width="4" height="110" fill="${d}"/><rect x="1880" y="146" width="40" height="22" fill="#C4D82E"/>`;
  b += `<rect x="2240" y="250" width="200" height="156" fill="${c}"/><rect x="2440" y="300" width="120" height="106" fill="${d}"/>`;
  return svg(W, Hh, b);
}

// ---------- Concrete section with aggregates highlighted ----------
function aggregateSection() {
  const R = rng(11), W = 900, Hh = 620;
  let b = `<defs><clipPath id="c"><rect x="0" y="0" width="${W}" height="${Hh}" rx="28"/></clipPath></defs><g clip-path="url(#c)">`;
  b += `<rect width="${W}" height="${Hh}" fill="#${H.paste}"/>`;
  b += dots(R, 0, 0, W, Hh, 900, 1, 2.4, H.pasteDark, 0.7);
  const big = scatter(R, -30, -30, W + 60, Hh + 60, 70, 34, 78, 6);
  const small = scatter(R, 0, 0, W, Hh, 260, 7, 16, 3, big);
  b += big.map((s) => `<path d="${stonePath(s.cx, s.cy, s.r, R)}" fill="#${R() > 0.5 ? "C9BDA8" : "B8AA92"}" stroke="#${H.limeDark}" stroke-width="5"/>`).join("");
  b += small.map((s) => `<path d="${stonePath(s.cx, s.cy, s.r, R)}" fill="#A79C8B" stroke="#${H.limeDark}" stroke-width="2.5"/>`).join("");
  b += dots(R, 0, 0, W, Hh, 40, 3, 6, "4B5058", 0.8);
  b += `</g>`;
  return svg(W, Hh, b);
}

// ---------- Hydration: three stages in circular "microscope" views ----------
function hydrationStages() {
  const W = 1080, Hh = 340;
  let b = `<defs>${arrowHead("a", H.orange)}`;
  [0, 1, 2].forEach((i) => (b += `<clipPath id="p${i}"><circle cx="${170 + i * 370}" cy="170" r="150"/></clipPath>`));
  b += `</defs>`;
  [0, 1, 2].forEach((i) => {
    const cx = 170 + i * 370, R = rng(5);
    b += `<circle cx="${cx}" cy="170" r="150" fill="#${i === 0 ? H.waterLight : i === 1 ? "D9DEE5" : "C3C8D0"}"/>`;
    b += `<g clip-path="url(#p${i})">`;
    const grains = scatter(R, cx - 160, 10, 320, 320, 14, 18, 34, 22);
    if (i === 2) {
      // dense C-S-H network bridging grains
      const R2 = rng(9);
      for (let k = 0; k < 260; k++) {
        const g = grains[k % grains.length], a = R2() * Math.PI * 2, len = 25 + R2() * 35;
        b += `<line x1="${g.cx}" y1="${g.cy}" x2="${(g.cx + Math.cos(a) * len).toFixed(1)}" y2="${(g.cy + Math.sin(a) * len).toFixed(1)}" stroke="#${H.navy}" stroke-width="2.2" opacity="0.75"/>`;
      }
    }
    grains.forEach((g) => {
      if (i === 1) {
        const R2 = rng(Math.floor(g.cx * g.cy));
        for (let k = 0; k < 22; k++) {
          const a = (k / 22) * Math.PI * 2, len = g.r + 8 + R2() * 12;
          b += `<line x1="${g.cx}" y1="${g.cy}" x2="${(g.cx + Math.cos(a) * len).toFixed(1)}" y2="${(g.cy + Math.sin(a) * len).toFixed(1)}" stroke="#${H.navy}" stroke-width="2" opacity="0.7"/>`;
        }
        b += `<circle cx="${g.cx}" cy="${g.cy}" r="${g.r + 4}" fill="#${H.orangeLight}" stroke="#${H.orange}" stroke-width="3"/>`;
      }
      const rr = i === 2 ? g.r * 0.55 : g.r;
      b += `<path d="${stonePath(g.cx, g.cy, rr, R, 0.2)}" fill="#7A7F87" stroke="#4B5058" stroke-width="2"/>`;
    });
    b += `</g><circle cx="${cx}" cy="170" r="150" fill="none" stroke="#${H.navy}" stroke-width="6"/>`;
    if (i < 2) b += `<line x1="${cx + 165}" y1="170" x2="${cx + 205}" y2="170" stroke="#${H.orange}" stroke-width="8" marker-end="url(#a)"/>`;
  });
  return svg(W, Hh, b);
}

// ---------- 3D microstructure block with leader lines ----------
function microstructure() {
  const W = 1000, Hh = 640, R = rng(21);
  const fx = 40, fy = 150, fw = 560, fh = 440, dx = 120, dy = -100;
  let b = `<defs><clipPath id="f"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}"/></clipPath></defs>`;
  // top & side faces
  b += `<polygon points="${fx},${fy} ${fx + dx},${fy + dy} ${fx + fw + dx},${fy + dy} ${fx + fw},${fy}" fill="#D3D7DC" stroke="#${H.steel}" stroke-width="3"/>`;
  b += `<polygon points="${fx + fw},${fy} ${fx + fw + dx},${fy + dy} ${fx + fw + dx},${fy + fh + dy} ${fx + fw},${fy + fh}" fill="#8F959D" stroke="#${H.steel}" stroke-width="3"/>`;
  b += dots(R, fx + 40, fy + dy + 20, fw, 60, 120, 1.5, 3, "8F959D", 0.8);
  b += `<g clip-path="url(#f)"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="#${H.paste}"/>`;
  b += dots(R, fx, fy, fw, fh, 700, 1.2, 2.6, H.pasteDark, 0.8);
  b += dots(R, fx, fy, fw, fh, 60, 3, 6, "3E434A", 0.85);
  const hero = { cx: 250, cy: 360, r: 115 };
  const others = scatter(R, fx - 30, fy - 30, fw + 60, fh + 60, 16, 30, 70, 30, [{ ...hero, r: hero.r + 20 }]);
  for (const s of [hero, ...others]) {
    const d = stonePath(s.cx, s.cy, s.r, rng(Math.floor(s.cx + s.cy)), 0.18);
    b += `<path d="${d}" fill="none" stroke="#${H.lime}" stroke-width="${s === hero ? 28 : 16}" opacity="0.9"/>`;
    b += `<path d="${d}" fill="#${s === hero ? "B8AA92" : "C9BDA8"}" stroke="#${H.stoneDark}" stroke-width="2.5"/>`;
  }
  b += `</g><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="none" stroke="#${H.steel}" stroke-width="3"/>`;
  // leader lines: aggregate, ITZ, paste -> right side
  const lead = (x1, y1, y2, col) =>
    `<circle cx="${x1}" cy="${y1}" r="9" fill="#${col}" stroke="#fff" stroke-width="3"/><polyline points="${x1},${y1} ${x1 + 40},${y2} 980,${y2}" fill="none" stroke="#${col}" stroke-width="3"/>`;
  b += lead(250, 360, 470, H.navy);
  b += lead(355, 300, 300, H.limeDark);
  b += lead(470, 520, 590, H.ink);
  return { svg: svg(W, Hh, b), anchors: [470, 300, 590] };
}

// ---------- Cube under compression ----------
function cubeLoad() {
  const W = 520, Hh = 560;
  let b = `<defs>${arrowHead("a", H.orange)}</defs>`;
  b += `<rect x="100" y="110" width="320" height="26" fill="#${H.steel}"/><rect x="100" y="424" width="320" height="26" fill="#${H.steel}"/>`;
  b += `<polygon points="150,170 230,136 390,136 310,170" fill="#D3D7DC" stroke="#${H.steel}" stroke-width="3"/>`;
  b += `<rect x="150" y="170" width="160" height="254" fill="#${H.paste}" stroke="#${H.steel}" stroke-width="3"/>`;
  b += `<polygon points="310,170 390,136 390,390 310,424" fill="#8F959D" stroke="#${H.steel}" stroke-width="3"/>`;
  const R = rng(3);
  b += dots(R, 155, 175, 150, 245, 120, 1.5, 3, H.pasteDark);
  b += `<polyline points="200,170 215,240 195,300 220,360 205,424" fill="none" stroke="#${H.ink}" stroke-width="3"/>`;
  b += `<polyline points="270,170 255,250 280,330 262,424" fill="none" stroke="#${H.ink}" stroke-width="3"/>`;
  for (const x of [170, 260, 350]) {
    b += `<line x1="${x}" y1="10" x2="${x}" y2="100" stroke="#${H.orange}" stroke-width="9" marker-end="url(#a)"/>`;
    b += `<line x1="${x}" y1="550" x2="${x}" y2="460" stroke="#${H.orange}" stroke-width="9" marker-end="url(#a)"/>`;
  }
  b += `<text x="455" y="70" font-family="DejaVu Sans" font-weight="bold" font-size="46" fill="#${H.navy}">F</text>`;
  return svg(W, Hh, b);
}

// ---------- Pore structure: dense vs porous ----------
function poreSection(porous) {
  const W = 560, Hh = 420, R = rng(porous ? 77 : 78);
  let b = `<defs>${arrowHead("w", H.water)}<clipPath id="k"><rect width="${W}" height="${Hh}" rx="20"/></clipPath></defs><g clip-path="url(#k)">`;
  b += `<rect width="${W}" height="${Hh}" fill="#${H.paste}"/>`;
  b += dots(R, 0, 0, W, Hh, 400, 1, 2.2, H.pasteDark, 0.7);
  const agg = scatter(R, -20, 10, W + 40, Hh, 18, 30, 60, 22);
  b += stones(R, agg, "C2B6A1", H.stoneDark, 2);
  if (porous) {
    // connected capillary channels from top surface downwards
    for (let k = 0; k < 9; k++) {
      let x = 30 + k * 62, y = 0, d = `M${x},${y}`;
      while (y < Hh) { x += (R() - 0.5) * 50; y += 30 + R() * 30; d += ` L${x.toFixed(1)},${y.toFixed(1)}`; }
      b += `<path d="${d}" fill="none" stroke="#${H.water}" stroke-width="5" opacity="0.9"/>`;
    }
    b += dots(R, 0, 0, W, Hh, 160, 3, 7, H.water, 0.85);
  } else {
    b += dots(R, 0, 0, W, Hh, 30, 2, 4, "4B5058", 0.9);
  }
  b += `</g><rect x="2" y="2" width="${W - 4}" height="${Hh - 4}" rx="20" fill="none" stroke="#${H.navy}" stroke-width="4"/>`;
  return svg(W, Hh, b);
}

// ---------- Chlorides reaching the rebar ----------
function chlorideRebar() {
  const W = 1100, Hh = 470;
  let b = `<defs>${arrowHead("w", H.water)}</defs>`;
  b += `<rect x="0" y="60" width="${W}" height="410" fill="#${H.paste}"/>`;
  b += dots(rng(4), 0, 60, W, 410, 700, 1, 2.4, H.pasteDark, 0.7);
  b += `<rect x="0" y="0" width="${W}" height="60" fill="#${H.waterLight}"/>`;
  b += `<line x1="550" y1="0" x2="550" y2="${Hh}" stroke="#${H.navy}" stroke-width="4" stroke-dasharray="14 10"/>`;
  const ion = (x, y) => `<circle cx="${x}" cy="${y}" r="13" fill="#${H.water}"/><text x="${x}" y="${y + 6}" text-anchor="middle" font-family="DejaVu Sans" font-weight="bold" font-size="15" fill="#fff">Cl</text>`;
  const R = rng(8);
  for (let i = 0; i < 16; i++) b += ion(30 + R() * 490, 20 + R() * 120);
  for (let i = 0; i < 30; i++) b += ion(580 + R() * 490, 20 + R() * 330);
  b += `<rect x="0" y="330" width="${W}" height="0" />`;
  for (const x of [140, 400]) b += `<circle cx="${x}" cy="370" r="36" fill="#${H.steel}" stroke="#2D333B" stroke-width="5"/>`;
  for (const x of [700, 960]) {
    b += `<circle cx="${x}" cy="370" r="58" fill="#${H.rust}" opacity="0.55"/>`;
    b += `<circle cx="${x}" cy="370" r="36" fill="#${H.rust}" stroke="#5E2E12" stroke-width="5"/>`;
    b += `<polyline points="${x},334 ${x - 12},250 ${x + 8},170 ${x - 6},60" fill="none" stroke="#${H.ink}" stroke-width="4"/>`;
  }
  b += `<line x1="40" y1="300" x2="1060" y2="300" stroke="#${H.orange}" stroke-width="3" stroke-dasharray="6 8"/>`;
  b += `<text x="20" y="455" font-family="DejaVu Sans" font-weight="bold" font-size="30" fill="#${H.navy}">W/C 0.40</text>`;
  b += `<text x="570" y="455" font-family="DejaVu Sans" font-weight="bold" font-size="30" fill="#${H.red}">W/C 0.65</text>`;
  return svg(W, Hh, b);
}

// ---------- Slump cone with measurement ----------
function slumpCone() {
  const W = 900, Hh = 560;
  let b = `<defs>${arrowHead("a", H.orange)}${arrowHead("n", H.navy)}</defs>`;
  b += `<rect x="20" y="480" width="860" height="22" fill="#${H.steel}"/>`;
  // cone (left)
  b += `<polygon points="90,480 290,480 240,180 140,180" fill="#D3D7DC" stroke="#${H.steel}" stroke-width="5"/>`;
  b += `<line x1="100" y1="300" x2="70" y2="300" stroke="#${H.steel}" stroke-width="8"/><line x1="280" y1="300" x2="310" y2="300" stroke="#${H.steel}" stroke-width="8"/>`;
  b += `<line x1="140" y1="150" x2="240" y2="150" stroke="#${H.navy}" stroke-width="3" marker-start="url(#n)" marker-end="url(#n)"/>`;
  b += `<text x="190" y="138" text-anchor="middle" font-family="DejaVu Sans" font-size="26" fill="#${H.navy}">100</text>`;
  b += `<line x1="90" y1="530" x2="290" y2="530" stroke="#${H.navy}" stroke-width="3" marker-start="url(#n)" marker-end="url(#n)"/>`;
  b += `<text x="190" y="560" text-anchor="middle" font-family="DejaVu Sans" font-size="26" fill="#${H.navy}">200</text>`;
  b += `<line x1="40" y1="180" x2="40" y2="480" stroke="#${H.navy}" stroke-width="3" marker-start="url(#n)" marker-end="url(#n)"/>`;
  b += `<text x="30" y="340" text-anchor="end" font-family="DejaVu Sans" font-size="26" fill="#${H.navy}" transform="rotate(-90 30 340)">300</text>`;
  // slumped concrete + inverted cone reference (right)
  b += `<polygon points="560,480 760,480 710,180 610,180" fill="none" stroke="#${H.steel}" stroke-width="4" stroke-dasharray="12 8"/>`;
  b += `<path d="M520,480 C540,400 560,330 620,300 C660,285 700,292 735,310 C780,340 800,420 820,480Z" fill="#${H.paste}" stroke="#${H.steel}" stroke-width="4"/>`;
  b += dots(rng(2), 560, 320, 230, 150, 120, 2, 4, H.pasteDark);
  b += `<line x1="850" y1="180" x2="850" y2="300" stroke="#${H.orange}" stroke-width="6" marker-start="url(#a)" marker-end="url(#a)"/>`;
  b += `<line x1="760" y1="180" x2="870" y2="180" stroke="#${H.orange}" stroke-width="3" stroke-dasharray="6 6"/>`;
  b += `<line x1="680" y1="300" x2="870" y2="300" stroke="#${H.orange}" stroke-width="3" stroke-dasharray="6 6"/>`;
  // tamping rod
  b += `<line x1="380" y1="80" x2="470" y2="470" stroke="#${H.navy}" stroke-width="10" stroke-linecap="round"/>`;
  return svg(W, Hh, b);
}

function slumpShape(kind) {
  const W = 420, Hh = 300;
  let b = `<rect x="10" y="262" width="400" height="16" fill="#${H.steel}"/>`;
  b += `<polygon points="135,262 285,262 247,40 173,40" fill="none" stroke="#${H.steel}" stroke-width="3" stroke-dasharray="10 7"/>`;
  const shapes = {
    low: `<path d="M140,262 C150,180 160,90 185,62 C200,52 225,52 240,62 C262,95 272,180 282,262Z"/>`,
    ok: `<path d="M95,262 C115,210 135,160 170,140 C200,128 235,132 260,150 C295,180 312,225 325,262Z"/>`,
    high: `<path d="M20,262 C40,232 90,214 150,208 C200,204 250,206 300,214 C350,224 385,240 400,262Z"/>`,
  };
  b += shapes[kind].replace("/>", ` fill="#${H.paste}" stroke="#${H.steel}" stroke-width="4"/>`);
  if (kind === "high") b += `<ellipse cx="210" cy="262" rx="205" ry="10" fill="#${H.water}" opacity="0.6"/>`;
  return svg(W, Hh, b);
}

// ---------- Density container on a scale ----------
function densityContainer() {
  const W = 420, Hh = 440;
  let b = `<rect x="40" y="370" width="340" height="50" rx="8" fill="#${H.steel}"/><rect x="250" y="383" width="100" height="26" rx="4" fill="#9BE7A0"/>`;
  b += `<text x="300" y="404" text-anchor="middle" font-family="DejaVu Sans Mono" font-size="20" fill="#1B3A1E">18.42</text>`;
  b += `<rect x="90" y="355" width="240" height="15" fill="#2D333B"/>`;
  b += `<path d="M100,120 L100,345 Q100,355 110,355 L310,355 Q320,355 320,345 L320,120" fill="#${H.paste}" stroke="#${H.steel}" stroke-width="6"/>`;
  b += dots(rng(6), 108, 128, 205, 220, 140, 2, 4, H.pasteDark);
  b += `<ellipse cx="210" cy="120" rx="110" ry="22" fill="#D3D7DC" stroke="#${H.steel}" stroke-width="6"/>`;
  b += `<rect x="60" y="88" width="300" height="10" rx="4" fill="#${H.navy}" transform="rotate(-6 210 93)"/>`;
  return svg(W, Hh, b);
}

// ---------- Air pressure meter ----------
function airMeter() {
  const W = 420, Hh = 460;
  let b = `<path d="M80,230 L80,420 Q80,440 100,440 L320,440 Q340,440 340,420 L340,230Z" fill="#${H.paste}" stroke="#${H.steel}" stroke-width="6"/>`;
  b += dots(rng(12), 90, 240, 240, 190, 120, 2, 4, H.pasteDark);
  b += `<path d="M60,230 L360,230 L330,170 L90,170Z" fill="#D3D7DC" stroke="#${H.steel}" stroke-width="6"/>`;
  for (const x of [70, 350]) b += `<rect x="${x - 12}" y="190" width="24" height="60" rx="5" fill="#${H.navy}"/>`;
  b += `<rect x="195" y="110" width="30" height="60" fill="#${H.steel}"/>`;
  b += `<circle cx="210" cy="80" r="70" fill="#fff" stroke="#${H.navy}" stroke-width="10"/>`;
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI * (0.8 + i * 0.14);
    b += `<line x1="${210 + Math.cos(a) * 52}" y1="${80 + Math.sin(a) * 52}" x2="${210 + Math.cos(a) * 62}" y2="${80 + Math.sin(a) * 62}" stroke="#${H.ink}" stroke-width="3"/>`;
  }
  b += `<line x1="210" y1="80" x2="248" y2="44" stroke="#${H.orange}" stroke-width="6" stroke-linecap="round"/><circle cx="210" cy="80" r="8" fill="#${H.ink}"/>`;
  b += `<text x="210" y="125" text-anchor="middle" font-family="DejaVu Sans" font-weight="bold" font-size="20" fill="#${H.navy}">%</text>`;
  return svg(W, Hh, b);
}

// ---------- Specimens ----------
function specimen(kind) {
  const W = 360, Hh = 340, R = rng(kind.length * 13);
  let b = "";
  if (kind === "cube") {
    b += `<polygon points="70,110 150,60 300,60 220,110" fill="#D3D7DC" stroke="#${H.steel}" stroke-width="4"/>`;
    b += `<rect x="70" y="110" width="150" height="190" fill="#${H.paste}" stroke="#${H.steel}" stroke-width="4"/>`;
    b += `<polygon points="220,110 300,60 300,250 220,300" fill="#8F959D" stroke="#${H.steel}" stroke-width="4"/>`;
    b += dots(R, 75, 115, 140, 180, 90, 1.5, 3.2, H.pasteDark);
  } else {
    const rough = kind === "core";
    b += `<rect x="110" y="70" width="140" height="240" fill="#${H.paste}" stroke="#${H.steel}" stroke-width="4"/>`;
    b += dots(R, 115, 75, 130, 230, 100, 1.5, 3.2, H.pasteDark);
    if (rough) {
      const ag = scatter(R, 105, 80, 150, 220, 9, 10, 20, 8);
      b += ag.map((s) => `<path d="${stonePath(s.cx, s.cy, s.r, R)}" fill="#C2B6A1" stroke="#${H.stoneDark}" stroke-width="2"/>`).join("");
      for (let y = 90; y < 300; y += 26) b += `<line x1="110" y1="${y}" x2="250" y2="${y + 6}" stroke="#${H.pasteDark}" stroke-width="2"/>`;
    }
    b += `<ellipse cx="180" cy="310" rx="70" ry="20" fill="#${H.paste}" stroke="#${H.steel}" stroke-width="4"/>`;
    b += `<rect x="112" y="290" width="136" height="20" fill="#${H.paste}"/>`;
    b += `<line x1="110" y1="70" x2="110" y2="310" stroke="#${H.steel}" stroke-width="4"/><line x1="250" y1="70" x2="250" y2="310" stroke="#${H.steel}" stroke-width="4"/>`;
    b += `<ellipse cx="180" cy="70" rx="70" ry="20" fill="#D3D7DC" stroke="#${H.steel}" stroke-width="4"/>`;
    if (rough) b += `<path d="M30,20 L330,20 L330,45 L30,45Z" fill="#8F959D" opacity="0.5"/><ellipse cx="180" cy="32" rx="78" ry="12" fill="none" stroke="#${H.orange}" stroke-width="4" stroke-dasharray="8 6"/>`;
  }
  return svg(W, Hh, b);
}

// ---------- Compression machine ----------
function compressionMachine() {
  const W = 560, Hh = 640;
  let b = `<rect x="40" y="580" width="480" height="40" rx="6" fill="#${H.navy}"/>`;
  for (const x of [80, 450]) b += `<rect x="${x}" y="60" width="30" height="520" fill="#${H.steel}"/>`;
  b += `<rect x="50" y="40" width="460" height="70" rx="8" fill="#${H.navy}"/>`;
  b += `<rect x="250" y="110" width="60" height="70" fill="#${H.steel}"/><rect x="190" y="180" width="180" height="22" fill="#2D333B"/>`;
  b += `<rect x="215" y="202" width="130" height="150" fill="#${H.paste}" stroke="#${H.steel}" stroke-width="4"/>`;
  b += dots(rng(31), 220, 206, 120, 140, 70, 1.5, 3, H.pasteDark);
  b += `<polyline points="250,202 240,250 262,300 248,352" fill="none" stroke="#${H.ink}" stroke-width="3"/><polyline points="312,202 322,270 305,352" fill="none" stroke="#${H.ink}" stroke-width="3"/>`;
  b += `<rect x="190" y="352" width="180" height="22" fill="#2D333B"/><rect x="230" y="374" width="100" height="130" fill="#${H.orange}"/><rect x="170" y="504" width="220" height="76" fill="#${H.navy}"/>`;
  b += `<rect x="410" y="400" width="130" height="90" rx="10" fill="#1F2A37"/><rect x="422" y="414" width="106" height="40" rx="4" fill="#9BE7A0"/>`;
  b += `<text x="475" y="442" text-anchor="middle" font-family="DejaVu Sans Mono" font-weight="bold" font-size="22" fill="#1B3A1E">675.4</text>`;
  b += `<text x="475" y="478" text-anchor="middle" font-family="DejaVu Sans" font-size="18" fill="#fff">kN</text>`;
  return svg(W, Hh, b);
}

// ---------- Defects ----------
function segregation() {
  const W = 860, Hh = 520, R = rng(41);
  let b = `<defs>${arrowHead("a", H.orange)}</defs>`;
  b += `<rect x="150" y="120" width="460" height="390" fill="none" stroke="#${H.clay}" stroke-width="16"/>`;
  b += `<rect x="158" y="128" width="444" height="374" fill="#${H.paste}"/>`;
  b += `<rect x="158" y="128" width="444" height="130" fill="#D4D7DB"/>`;
  b += dots(R, 158, 130, 444, 125, 150, 1, 2.2, H.pasteDark, 0.7);
  const pile = scatter(R, 160, 300, 440, 200, 40, 16, 30, 3);
  const mid = scatter(R, 160, 250, 440, 60, 6, 10, 16, 6);
  b += stones(R, [...pile, ...mid]);
  b += dots(R, 170, 320, 420, 170, 30, 4, 9, "2D333B", 0.9);
  // falling stream from height
  b += `<path d="M370,0 L410,0 L400,110 L380,110Z" fill="#${H.paste}" opacity="0.9"/>`;
  b += stones(R, [{ cx: 390, cy: 40, r: 12 }, { cx: 395, cy: 85, r: 11 }]);
  b += `<line x1="660" y1="20" x2="660" y2="250" stroke="#${H.orange}" stroke-width="7" marker-start="url(#a)" marker-end="url(#a)"/>`;
  b += `<text x="690" y="150" font-family="DejaVu Sans" font-weight="bold" font-size="30" fill="#${H.orange}">&gt;1.5 m</text>`;
  return svg(W, Hh, b);
}

function bleeding() {
  const W = 760, Hh = 480, R = rng(43);
  let b = `<defs>${arrowHead("w", H.water)}</defs>`;
  b += `<rect x="20" y="100" width="720" height="360" fill="#${H.paste}"/>`;
  b += dots(R, 20, 100, 720, 360, 500, 1, 2.2, H.pasteDark, 0.7);
  const ag = scatter(R, 30, 150, 700, 300, 22, 22, 42, 18);
  ag.forEach((s) => (b += `<path d="M${s.cx - s.r * 0.9},${s.cy + s.r * 0.55} Q${s.cx},${s.cy + s.r * 1.35} ${s.cx + s.r * 0.9},${s.cy + s.r * 0.55}Z" fill="#${H.water}" opacity="0.85"/>`));
  b += stones(R, ag);
  for (const x of [200, 560]) {
    b += `<path d="M${x - 34},${250} Q${x},${300} ${x + 34},${250}Z" fill="#${H.water}"/>`;
    b += `<circle cx="${x}" cy="240" r="24" fill="#${H.steel}" stroke="#2D333B" stroke-width="4"/>`;
  }
  b += `<rect x="20" y="70" width="720" height="32" fill="#${H.water}" opacity="0.8"/>`;
  for (let i = 0; i < 6; i++) {
    const x = 80 + i * 120;
    b += `<line x1="${x}" y1="200" x2="${x}" y2="110" stroke="#${H.water}" stroke-width="5" marker-end="url(#w)"/>`;
  }
  return svg(W, Hh, b);
}

function honeycomb() {
  const W = 760, Hh = 520, R = rng(47);
  let b = `<rect width="${W}" height="${Hh}" rx="18" fill="#C4C8CD"/>`;
  b += dots(R, 0, 0, W, Hh, 700, 1, 2.4, H.pasteDark, 0.6);
  for (const y of [120, 260, 400]) for (const x of [160, 380, 600]) b += `<circle cx="${x}" cy="${y}" r="9" fill="#8F959D"/>`;
  b += `<path d="M120,520 C140,400 230,330 360,320 C480,312 600,360 650,520Z" fill="#8A8F96"/>`;
  const st = scatter(R, 140, 340, 500, 180, 46, 14, 26, 5).filter((s) => s.cy > 330 + (Math.abs(s.cx - 390) / 260) * 60);
  st.forEach((s) => (b += `<circle cx="${s.cx + 4}" cy="${s.cy + 6}" r="${s.r * 0.8}" fill="#2D333B" opacity="0.85"/>`));
  b += stones(R, st);
  b += `<path d="M120,520 C140,400 230,330 360,320 C480,312 600,360 650,520" fill="none" stroke="#${H.red}" stroke-width="5" stroke-dasharray="14 10"/>`;
  return svg(W, Hh, b);
}

function plasticCracks() {
  const W = 760, Hh = 500, R = rng(53);
  let b = `<defs>${arrowHead("a", H.navyMid)}</defs>`;
  b += `<polygon points="60,470 700,470 600,200 160,200" fill="#${H.paste}" stroke="#${H.steel}" stroke-width="4"/>`;
  b += dots(R, 160, 205, 440, 260, 250, 1, 2, H.pasteDark, 0.6);
  for (let i = 0; i < 9; i++) {
    let x = 170 + i * 50 + R() * 20, y = 240 + R() * 140, d = `M${x},${y}`;
    for (let k = 0; k < 5; k++) { x += 8 + R() * 10; y += (R() - 0.3) * 18; d += ` L${x.toFixed(1)},${y.toFixed(1)}`; }
    b += `<path d="${d}" fill="none" stroke="#2D333B" stroke-width="3"/>`;
  }
  b += `<circle cx="660" cy="80" r="46" fill="#${H.orange}"/>`;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    b += `<line x1="${660 + Math.cos(a) * 58}" y1="${80 + Math.sin(a) * 58}" x2="${660 + Math.cos(a) * 76}" y2="${80 + Math.sin(a) * 76}" stroke="#${H.orange}" stroke-width="6" stroke-linecap="round"/>`;
  }
  for (const y of [60, 105, 150]) b += `<path d="M30,${y} Q130,${y - 25} 230,${y} T420,${y}" fill="none" stroke="#${H.navyMid}" stroke-width="6" marker-end="url(#a)"/>`;
  for (const x of [260, 360, 460]) b += `<path d="M${x},230 q-12,-25 0,-50 q12,-25 0,-50" fill="none" stroke="#${H.water}" stroke-width="4" opacity="0.8"/>`;
  return svg(W, Hh, b);
}

function scaling() {
  const W = 760, Hh = 480, R = rng(59);
  let b = `<rect x="20" y="160" width="720" height="300" fill="#${H.paste}"/>`;
  b += dots(R, 20, 160, 720, 300, 400, 1, 2.2, H.pasteDark, 0.7);
  b += stones(R, scatter(R, 30, 200, 700, 250, 18, 18, 34, 14));
  // intact surface on the right, scaled zone on the left
  b += `<rect x="440" y="130" width="300" height="32" fill="#D4D7DB" stroke="#${H.steel}" stroke-width="2"/>`;
  b += `<path d="M20,162 L60,150 L100,166 L150,152 L200,170 L260,155 L320,168 L380,150 L440,160 L440,162Z" fill="#AEB3BA"/>`;
  b += stones(R, [{ cx: 120, cy: 172, r: 16 }, { cx: 300, cy: 175, r: 18 }]);
  const flakes = [[90, 90, -15], [180, 60, 20], [270, 100, -8], [360, 70, 12]];
  flakes.forEach(([x, y, a]) => (b += `<rect x="${x}" y="${y}" width="70" height="16" rx="3" fill="#D4D7DB" stroke="#${H.steel}" stroke-width="2" transform="rotate(${a} ${x + 35} ${y + 8})"/>`));
  return svg(W, Hh, b);
}

function curing() {
  const W = 760, Hh = 460, R = rng(61);
  let b = `<polygon points="40,430 720,430 620,220 140,220" fill="#${H.paste}" stroke="#${H.steel}" stroke-width="4"/>`;
  b += dots(R, 140, 225, 480, 200, 200, 1, 2, H.pasteDark, 0.6);
  b += `<path d="M120,250 Q260,215 400,240 T690,250 L740,420 L30,420Z" fill="#${H.waterLight}" opacity="0.85" stroke="#${H.water}" stroke-width="4"/>`;
  for (let i = 0; i < 26; i++) {
    const x = 180 + R() * 420, y = 40 + R() * 150;
    b += `<path d="M${x},${y} q6,10 0,16 q-6,-6 0,-16Z" fill="#${H.water}"/>`;
  }
  b += `<rect x="160" y="14" width="460" height="14" rx="7" fill="#${H.navy}"/>`;
  for (let x = 190; x <= 590; x += 50) b += `<rect x="${x - 5}" y="26" width="10" height="12" fill="#${H.navy}"/>`;
  b += `<rect x="610" y="0" width="14" height="40" rx="5" fill="#${H.navy}"/>`;
  return svg(W, Hh, b);
}

// ---------- Rejected-materials gallery tiles ----------
function tile(kind) {
  const W = 400, Hh = 300, R = rng(kind.length * 31 + 7);
  let b = "";
  if (kind === "ok") {
    b += `<rect width="${W}" height="${Hh}" fill="#E6E8EB"/>`;
    b += stones(R, scatter(R, -10, -10, W + 20, Hh + 20, 70, 18, 34, 2));
  } else if (kind === "clay") {
    b += `<rect width="${W}" height="${Hh}" fill="#D9C2A0"/>`;
    const st = scatter(R, -10, -10, W + 20, Hh + 20, 55, 18, 32, 4);
    b += st.map((s) => `<path d="${stonePath(s.cx, s.cy, s.r + 5, R)}" fill="#${H.clay}" opacity="0.9"/>`).join("");
    b += stones(R, st.filter((_, i) => i % 3 === 0));
    b += scatter(R, 0, 0, W, Hh, 8, 20, 30, 40).map((s) => `<ellipse cx="${s.cx}" cy="${s.cy}" rx="${s.r}" ry="${s.r * 0.7}" fill="#7B4F28"/>`).join("");
  } else if (kind === "lumps") {
    b += `<rect width="${W}" height="${Hh}" fill="#B9BDC3"/>`;
    b += dots(R, 0, 0, W, Hh, 900, 0.8, 1.8, "A1A6AD");
    b += scatter(R, 20, 20, W - 40, Hh - 40, 9, 22, 46, 20).map((s) => `<path d="${stonePath(s.cx, s.cy, s.r, R, 0.15)}" fill="#8F959D" stroke="#5B616A" stroke-width="3"/>`).join("");
  } else if (kind === "organic") {
    b += `<rect width="${W}" height="${Hh}" fill="#B8A27C"/>`;
    b += dots(R, 0, 0, W, Hh, 900, 1, 2.2, "8E7A57");
    b += dots(R, 0, 0, W, Hh, 70, 3, 8, "3B2A17", 0.9);
    for (let i = 0; i < 6; i++) {
      const x = 30 + R() * 330, y = 30 + R() * 230;
      b += `<path d="M${x},${y} q30,-20 60,5 q-25,25 -60,-5Z" fill="#4E6B2E"/>`;
      b += `<path d="M${x + 60},${y + 40} c20,10 30,30 60,32" fill="none" stroke="#5A3D1E" stroke-width="4"/>`;
    }
  } else if (kind === "phase") {
    b += `<rect width="${W}" height="${Hh}" fill="#E6E8EB"/>`;
    b += `<rect x="135" y="30" width="130" height="250" rx="16" fill="#fff" stroke="#${H.steel}" stroke-width="5"/>`;
    b += `<rect x="140" y="70" width="120" height="100" fill="#F2DFA7"/>`;
    b += `<rect x="140" y="170" width="120" height="105" rx="10" fill="#6B4A1E"/>`;
    b += `<line x1="140" y1="170" x2="260" y2="170" stroke="#${H.red}" stroke-width="4" stroke-dasharray="8 6"/>`;
    b += `<rect x="150" y="14" width="100" height="22" rx="4" fill="#${H.navy}"/>`;
  }
  return svg(W, Hh, b);
}

// ---------- Sampling: stockpile increments + riffle splitter ----------
function sampling() {
  const W = 1100, Hh = 520, R = rng(71);
  let b = `<defs>${arrowHead("a", H.orange)}</defs>`;
  b += `<rect x="0" y="470" width="620" height="14" fill="#${H.steel}"/>`;
  b += `<path d="M20,470 C120,330 220,170 310,160 C400,170 500,330 600,470Z" fill="#C9BDA8" stroke="#${H.stoneDark}" stroke-width="3"/>`;
  b += stones(R, scatter(R, 120, 220, 380, 240, 60, 7, 13, 2).filter((s) => s.cy > 470 - (470 - 160) * (1 - Math.abs(s.cx - 310) / 290)), "B8AA92", H.stoneDark, 1.5);
  // segregated toe (coarse stones rolled down) — avoid sampling here
  b += stones(R, [{ cx: 50, cy: 452, r: 16 }, { cx: 85, cy: 455, r: 13 }, { cx: 560, cy: 452, r: 16 }, { cx: 530, cy: 456, r: 12 }]);
  // sampling points: top, middle, lower third, under the surface
  for (const [x, y] of [[310, 215], [205, 330], [420, 330], [140, 420], [480, 420]]) {
    b += `<circle cx="${x}" cy="${y}" r="17" fill="#${H.orange}" stroke="#fff" stroke-width="4"/>`;
  }
  b += `<line x1="640" y1="300" x2="720" y2="300" stroke="#${H.orange}" stroke-width="8" marker-end="url(#a)"/>`;
  // riffle splitter
  const rx = 760;
  b += `<polygon points="${rx},170 ${rx + 300},170 ${rx + 270},290 ${rx + 30},290" fill="#D3D7DC" stroke="#${H.steel}" stroke-width="4"/>`;
  for (let i = 0; i < 8; i++) {
    const x = rx + 40 + i * 28;
    b += `<rect x="${x}" y="290" width="22" height="60" fill="${i % 2 ? "#8F959D" : "#B9BDC3"}" stroke="#${H.steel}" stroke-width="2" transform="skewX(${i % 2 ? 20 : -20})" transform-origin="${x + 11} 290"/>`;
  }
  b += `<rect x="${rx - 20}" y="380" width="150" height="70" rx="6" fill="#${H.navyLight}" stroke="#${H.navy}" stroke-width="4"/>`;
  b += `<rect x="${rx + 170}" y="380" width="150" height="70" rx="6" fill="#${H.navyLight}" stroke="#${H.navy}" stroke-width="4"/>`;
  b += stones(R, scatter(R, rx - 15, 400, 140, 45, 10, 6, 10, 1));
  b += stones(R, scatter(R, rx + 175, 400, 140, 45, 10, 6, 10, 1));
  b += `<rect x="${rx + 90}" y="80" width="120" height="60" rx="8" fill="#${H.orange}"/>`;
  b += stones(R, [{ cx: rx + 130, cy: 155, r: 8 }, { cx: rx + 160, cy: 160, r: 7 }]);
  return svg(W, Hh, b);
}

// ---------- Sand equivalent: clean vs clayey sand in graduated cylinders ----------
function sandEquivalent() {
  const W = 760, Hh = 560, R = rng(73);
  let b = `<defs>${arrowHead("n", H.navy)}</defs>`;
  const cyl = (x, clay, sand) => {
    let g = `<rect x="${x}" y="40" width="150" height="470" rx="14" fill="#FFFFFF" stroke="#${H.steel}" stroke-width="5"/>`;
    g += `<rect x="${x + 6}" y="${500 - sand - clay - 40}" width="138" height="40" fill="#EAF6FD"/>`;
    g += `<rect x="${x + 6}" y="${500 - sand - clay}" width="138" height="${clay}" fill="#B98A5A" opacity="0.75"/>`;
    g += `<rect x="${x + 6}" y="${500 - sand}" width="138" height="${sand + 4}" fill="#D9C7A1"/>`;
    g += dots(R, x + 8, 500 - sand, 134, sand, 120, 1.5, 3, "A8916A");
    for (let k = 0; k < 9; k++) g += `<line x1="${x + 150}" y1="${80 + k * 48}" x2="${x + 130}" y2="${80 + k * 48}" stroke="#${H.steel}" stroke-width="2"/>`;
    // h1 (top of clay) and h2 (top of sand)
    g += `<line x1="${x - 20}" y1="500" x2="${x - 20}" y2="${500 - sand - clay}" stroke="#${H.navy}" stroke-width="3" marker-end="url(#n)"/>`;
    g += `<text x="${x - 28}" y="${500 - (sand + clay) / 2}" text-anchor="end" font-family="DejaVu Sans" font-weight="bold" font-size="26" fill="#${H.navy}">h1</text>`;
    g += `<line x1="${x + 175}" y1="500" x2="${x + 175}" y2="${500 - sand}" stroke="#${H.orange}" stroke-width="3" marker-end="url(#n)"/>`;
    g += `<text x="${x + 185}" y="${500 - sand / 2}" font-family="DejaVu Sans" font-weight="bold" font-size="26" fill="#${H.orange}">h2</text>`;
    return g;
  };
  b += cyl(80, 40, 200) + cyl(470, 230, 140);
  return svg(W, Hh, b);
}

// ---------- Los Angeles drum ----------
function laDrum() {
  const W = 700, Hh = 520, R = rng(79);
  let b = `<defs>${arrowHead("a", H.orange)}</defs>`;
  b += `<rect x="60" y="440" width="580" height="30" rx="6" fill="#${H.navy}"/>`;
  b += `<rect x="90" y="250" width="30" height="190" fill="#${H.steel}"/><rect x="580" y="250" width="30" height="190" fill="#${H.steel}"/>`;
  b += `<circle cx="350" cy="250" r="190" fill="#D3D7DC" stroke="#${H.steel}" stroke-width="10"/>`;
  b += `<circle cx="350" cy="250" r="165" fill="#F3F5F7"/>`;
  b += `<rect x="320" y="85" width="140" height="22" fill="#${H.steel}" transform="rotate(-25 350 250)"/>`;
  const balls = scatter(R, 230, 300, 240, 100, 11, 20, 20, 3);
  b += stones(R, scatter(R, 210, 320, 280, 90, 22, 9, 16, 2, balls));
  balls.forEach((s) => (b += `<circle cx="${s.cx}" cy="${s.cy}" r="19" fill="#4A5563"/><circle cx="${s.cx - 6}" cy="${s.cy - 6}" r="6" fill="#9AA3AD"/>`));
  b += `<path d="M150,120 A230,230 0 0 1 550,120" fill="none" stroke="#${H.orange}" stroke-width="9" marker-end="url(#a)"/>`;
  b += `<circle cx="350" cy="250" r="22" fill="#${H.navy}"/>`;
  return svg(W, Hh, b);
}

// ---------- Recycled-water system, drawn right-to-left: truck → reclaimer → ponds → tank → plant ----------
function waterPlant() {
  const W = 1400, Hh = 380;
  let b = `<defs>${arrowHead("w", H.water)}${arrowHead("a", H.orange)}</defs>`;
  b += `<rect x="0" y="330" width="${W}" height="10" fill="#${H.blueGray}"/>`;
  // 1 truck (x≈1260)
  const tx = 1150;
  b += `<g transform="rotate(-10 ${tx + 90} 230)"><ellipse cx="${tx + 90}" cy="230" rx="85" ry="42" fill="#D3D7DC" stroke="#${H.steel}" stroke-width="4"/></g>`;
  b += `<path d="M${tx + 170},285 L${tx + 170},215 L${tx + 220},215 L${tx + 240},250 L${tx + 240},300 L${tx + 170},300Z" fill="#${H.orange}"/>`;
  b += `<rect x="${tx}" y="285" width="190" height="14" fill="#${H.steel}"/>`;
  for (const wx of [tx + 30, tx + 90, tx + 210]) b += `<circle cx="${wx}" cy="315" r="17" fill="#${H.navy}"/>`;
  b += `<path d="M${tx},250 q-30,10 -40,40" fill="none" stroke="#${H.water}" stroke-width="6"/>`;
  // 2 reclaimer (x≈960)
  const rx = 880;
  b += `<polygon points="${rx},180 ${rx + 170},180 ${rx + 150},300 ${rx + 20},300" fill="#${H.navyLight}" stroke="#${H.navy}" stroke-width="4"/>`;
  b += `<line x1="${rx + 30}" y1="290" x2="${rx + 150}" y2="150" stroke="#${H.steel}" stroke-width="12"/>`;
  for (let k = 0; k < 6; k++) b += `<line x1="${rx + 40 + k * 20}" y1="${280 - k * 23}" x2="${rx + 55 + k * 20}" y2="${292 - k * 23}" stroke="#${H.navy}" stroke-width="4"/>`;
  b += stones(rng(5), [{ cx: rx + 170, cy: 145, r: 10 }, { cx: rx + 190, cy: 160, r: 9 }, { cx: rx + 180, cy: 318, r: 12 }, { cx: rx + 205, cy: 320, r: 10 }, { cx: rx + 192, cy: 305, r: 9 }]);
  // 3 settling ponds cascade (x≈640)
  const px = 520;
  [0, 1, 2].forEach((k) => {
    const x = px + 200 - k * 100, y = 230 + k * 20;
    b += `<rect x="${x}" y="${y}" width="95" height="${100 - k * 20}" fill="#${H.waterLight}" stroke="#${H.steel}" stroke-width="4"/>`;
    b += `<rect x="${x + 3}" y="${y + 60 - k * 20}" width="89" height="${37}" fill="#${k === 0 ? "9E8A6E" : k === 1 ? "B7A88F" : "CFC6B5"}"/>`;
  });
  // 4 agitated tank (x≈330)
  const kx = 270;
  b += `<rect x="${kx}" y="150" width="140" height="180" rx="10" fill="#${H.waterLight}" stroke="#${H.navy}" stroke-width="5"/>`;
  b += `<rect x="${kx + 64}" y="110" width="12" height="160" fill="#${H.steel}"/><rect x="${kx + 40}" y="100" width="60" height="22" rx="4" fill="#${H.navy}"/>`;
  b += `<path d="M${kx + 30},260 q40,-30 80,0" fill="none" stroke="#${H.steel}" stroke-width="7"/>`;
  b += `<path d="M${kx + 30},230 a40,15 0 1 0 80,0" fill="none" stroke="#${H.orange}" stroke-width="4" marker-end="url(#a)"/>`;
  // density meter
  b += `<circle cx="${kx - 40}" cy="275" r="30" fill="#fff" stroke="#${H.navy}" stroke-width="6"/><line x1="${kx - 40}" y1="275" x2="${kx - 24}" y2="259" stroke="#${H.orange}" stroke-width="5"/>`;
  // 5 batching plant (x≈90)
  b += `<rect x="40" y="70" width="70" height="200" rx="8" fill="#${H.navyLight}" stroke="#${H.navy}" stroke-width="4"/><rect x="115" y="160" width="80" height="110" fill="#${H.navyLight}" stroke="#${H.navy}" stroke-width="4"/>`;
  b += `<rect x="50" y="270" width="10" height="60" fill="#${H.navy}"/><rect x="180" y="270" width="10" height="60" fill="#${H.navy}"/>`;
  // flow arrows (right → left)
  for (const [x1, x2] of [[1110, 1060], [870, 830], [510, 425], [225, 205]]) {
    b += `<line x1="${x1}" y1="200" x2="${x2}" y2="200" stroke="#${H.water}" stroke-width="8" marker-end="url(#w)"/>`;
  }
  return { svg: svg(W, Hh, b), anchors: [1255, 965, 670, 340, 115] };
}

// ---------- Natural vs recycled aggregate particle ----------
function rcaParticles() {
  const W = 820, Hh = 340, R = rng(83);
  let b = "";
  b += `<path d="${stonePath(200, 170, 120, R, 0.15)}" fill="#C2B6A1" stroke="#${H.stoneDark}" stroke-width="4"/>`;
  b += dots(R, 140, 110, 120, 110, 30, 2, 4, "A99C86");
  // recycled: original stone wrapped in porous adhered mortar
  const shell = stonePath(610, 170, 140, R, 0.2);
  b += `<defs><clipPath id="sh"><path d="${shell}"/></clipPath></defs>`;
  b += `<path d="${shell}" fill="#B9BDC3"/>`;
  b += `<g clip-path="url(#sh)">${dots(R, 460, 20, 300, 300, 160, 3, 7, "8F959D")}${dots(R, 460, 20, 300, 300, 60, 2, 4, "5B616A")}</g>`;
  b += `<path d="${shell}" fill="none" stroke="#${H.orange}" stroke-width="5" stroke-dasharray="12 8"/>`;
  b += `<path d="${stonePath(620, 175, 78, R, 0.15)}" fill="#C2B6A1" stroke="#${H.stoneDark}" stroke-width="4"/>`;
  return svg(W, Hh, b);
}

module.exports = {
  H, skyline, aggregateSection, hydrationStages, microstructure, cubeLoad, poreSection,
  chlorideRebar, slumpCone, slumpShape, densityContainer, airMeter, specimen,
  compressionMachine, segregation, bleeding, honeycomb, plasticCracks, scaling, curing, tile,
  sampling, sandEquivalent, laDrum, waterPlant, rcaParticles,
};
