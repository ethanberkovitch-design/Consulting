(function () {
  'use strict';

  const C = window.COURSE;
  const IMG = window.IMAGES || {};
  const CFG = window.CONFIG || {};
  const $app = document.getElementById('app');
  const KEY = 'cca.v1.';
  const LETTERS = ['א', 'ב', 'ג', 'ד', 'ה'];

  /* ───────── עזרים ───────── */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content; };
  const img = (k) => IMG[k] || '';
  const chapter = n => C.chapters.find(c => c.num === n);
  const roleById = id => C.roles.find(r => r.id === id) || C.roles[C.roles.length - 1];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const fmtDate = ts => ts ? new Date(ts).toLocaleDateString('he-IL') : '';
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  const store = {
    get(k, d) { try { const v = localStorage.getItem(KEY + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) { /* מצב פרטי: ממשיכים בזיכרון בלבד */ } },
    del(k) { try { localStorage.removeItem(KEY + k); } catch (e) { } }
  };

  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  function confetti() {
    const box = document.createElement('div'); box.className = 'confetti';
    const colors = ['#E67A2E', '#F0B505', '#2EA05A', '#2E86C1', '#D64545', '#1F3A5F'];
    for (let i = 0; i < 70; i++) {
      const p = document.createElement('i');
      p.style.left = Math.random() * 100 + 'vw';
      p.style.background = colors[i % colors.length];
      p.style.animationDuration = (1.8 + Math.random() * 1.8) + 's';
      p.style.animationDelay = (Math.random() * .4) + 's';
      box.appendChild(p);
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 4200);
  }

  /* ───────── מצב ───────── */
  let S = null; // { profile, progress, certAck, completedSent }

  function load(empId) { return store.get('emp.' + empId, null); }
  function save() { if (S) { store.set('emp.' + S.profile.empId, S); store.set('last', S.profile.empId); } }

  function path() { return roleById(S.profile.role).chapters; }
  function optional() { const p = path(); return C.chapters.map(c => c.num).filter(n => !p.includes(n)); }
  function passed(n) { return !!(S.progress[n] && S.progress[n].passed); }
  function requiredDone() { return path().every(passed); }
  function isUnlocked(n) {
    const p = path();
    const i = p.indexOf(n);
    if (i === -1) return requiredDone();
    return p.slice(0, i).every(passed);
  }
  function nextChapter() { return path().find(n => !passed(n)); }

  /* ───────── שרת: Apps Script ───────── */
  const inAppsScript = () => !!(window.google && google.script && google.script.run);
  const hasBackend = () => inAppsScript() || !!CFG.apiUrl;

  function api(action, payload) {
    if (inAppsScript()) {
      return new Promise((res, rej) => google.script.run.withSuccessHandler(res).withFailureHandler(rej).api(action, payload));
    }
    if (!CFG.apiUrl) return Promise.reject(new Error('no-backend'));
    // text/plain חוסך בקשת preflight, ש-Apps Script לא יודע לענות עליה
    return fetch(CFG.apiUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, payload }) })
      .then(r => r.json());
  }

  function queue(evt) {
    const box = store.get('outbox', []);
    box.push(evt); store.set('outbox', box);
    flush();
  }

  let flushing = false;
  async function flush() {
    if (flushing || !hasBackend()) { updateSync(); return; }
    flushing = true;
    let box = store.get('outbox', []);
    while (box.length) {
      try {
        const r = await api('submit', box[0]);
        if (!r || !r.ok) throw new Error((r && r.error) || 'failed');
        box.shift(); store.set('outbox', box);
      } catch (e) { break; }
    }
    flushing = false;
    updateSync();
  }

  function syncState() {
    if (!hasBackend()) return 'local';
    return store.get('outbox', []).length ? 'pending' : 'ok';
  }
  function syncHtml() {
    const s = syncState();
    const txt = { ok: 'התוצאות נשמרות במערכת', pending: 'ממתין לשליחת תוצאות…', local: 'מצב הדגמה: התוצאות נשמרות במכשיר בלבד' }[s];
    return `<span class="sync-note ${s === 'ok' ? '' : s}" id="sync"><i></i>${txt}</span>`;
  }
  function updateSync() { const el = document.getElementById('sync'); if (el) el.outerHTML = syncHtml(); }
  window.addEventListener('online', flush);

  function sendEvent(type, extra) {
    const p = S.profile;
    queue(Object.assign({
      eventId: uid(), type, ts: new Date().toISOString(),
      name: p.name, empId: p.empId, site: p.site || '', role: p.role, roleLabel: roleById(p.role).label, mode: p.mode,
      required: path().join(','), passedCount: path().filter(passed).length, requiredCount: path().length
    }, extra));
  }

  /* ───────── מסגרת ───────── */
  function frame(inner, opts = {}) {
    const logged = !!S;
    $app.innerHTML = '';
    $app.appendChild(h(`
      <header class="topbar">
        <div class="topbar-in">
          <span class="logo-pill"><img src="${img('img1')}" alt="שיכון ובינוי"></span>
          <div class="brand">ברוכים הבאים לעולם הבטון<small>לומדת קליטה ורענון · מפעלי בטון, מחצבות ומוספים</small></div>
          <span class="spacer"></span>
          <div class="top-actions">
            <button class="icon-btn" data-act="gloss" title="מילון מונחים">📖<span class="lbl">מילון</span></button>
            <button class="icon-btn" data-act="rules" title="עשרת כללי הזהב">⭐<span class="lbl">כללי הזהב</span></button>
            ${CFG.review ? '<button class="icon-btn" data-act="key" title="מפתח תשובות" style="background:var(--yellow);color:var(--navy)">🔑<span class="lbl">מפתח תשובות</span></button>' : ''}
            ${logged ? `<button class="icon-btn" data-act="home" title="המסלול שלי">🏠<span class="lbl">המסלול שלי</span></button>
            <button class="icon-btn" data-act="logout" title="החלפת משתמש">⎋<span class="lbl">יציאה</span></button>` : ''}
          </div>
        </div>
      </header>
      ${CFG.review ? '<div class="review-bar no-print">גרסת בחינה · התוצאות לא נשמרות במערכת · מפתח התשובות (🔑) זמין לסוקרים בלבד</div>' : ''}
      <main id="main"></main>
      <footer class="footer no-print">
        ${opts.hideMgr || CFG.review ? '' : '<button data-act="mgr">כניסת מנהלים</button> · '}נבנה על בסיס חוברת ההדרכה לעובדים חדשים. הנוהל המלא נמצא אצל מנהל האיכות.
      </footer>`));
    const main = document.getElementById('main');
    if (typeof inner === 'string') main.appendChild(h(inner)); else main.appendChild(inner);
    window.scrollTo({ top: 0 });
    return main;
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'gloss') showGlossary();
    else if (act === 'rules') showRules();
    else if (act === 'key') showAnswerKey();
    else if (act === 'home') dashboard();
    else if (act === 'mgr') managerLogin();
    else if (act === 'logout') { if (confirm('לצאת ולהחליף משתמש? ההתקדמות נשמרת.')) { S = null; store.del('last'); login(); } }
  });

  /* ───────── כניסה ───────── */
  function login() {
    const roles = C.roles.map(r => `<option value="${r.id}">${esc(r.label)}</option>`).join('');
    const total = C.chapters.reduce((s, c) => s + c.quiz.length, 0);
    const main = frame(`
      <section class="hero">
        <span class="kicker">לומדה דיגיטלית</span>
        <h1>ברוכים הבאים לעולם הבטון</h1>
        <p>כל מה שעובד חדש צריך לדעת, ממה עשוי בטון ועד איך מקבלים הזמנה, קולטים חומרים ועובדים בבטחה. לומדים, עונים, מתקדמים.</p>
        <div class="chips"><span class="chip">12 פרקים</span><span class="chip">${total} שאלות מצבים</span><span class="chip">מסלול לפי תפקיד</span><span class="chip">תעודה בסיום</span></div>
        <div class="hero-img"><img src="${img('img2')}" alt="מהסלע במחצבה ועד הבניין"></div>
      </section>
      <div class="login-grid">
        <form class="card" id="loginForm" novalidate>
          <h2 style="color:var(--navy);font-weight:900;margin-bottom:14px">בואו נתחיל</h2>
          <div class="field"><label for="fName">שם מלא</label><input id="fName" autocomplete="name" required></div>
          <div class="field"><label for="fEmp">מספר עובד</label><input id="fEmp" inputmode="numeric" required><span class="hint">משמש לזיהוי ולשמירת ההתקדמות שלכם</span></div>
          <div class="field"><label for="fSite">מפעל / אתר</label><input id="fSite" placeholder="לדוגמה: מפעל חדרה"></div>
          <div class="field"><label for="fRole">התפקיד שלי</label><select id="fRole" required><option value="">בחרו תפקיד…</option>${roles}</select><span class="hint" id="roleHint">המסלול נבנה לפי התפקיד. החונך יכול לעזור לבחור.</span></div>
          <div class="field"><span style="font-weight:700;font-size:15px">סוג ההדרכה</span>
            <div class="mode-pick">
              <label><input type="radio" name="mode" value="new" checked><span><span class="t">🌱 עובד/ת חדש/ה</span><span class="d">כל התוכן, האיורים וההדגמות, ואז מבחן</span></span></label>
              <label><input type="radio" name="mode" value="refresh"><span><span class="t">🔄 רענון</span><span class="d">סיכום "זכרו" ומבחן. התוכן המלא זמין בלחיצה</span></span></label>
            </div>
          </div>
          <div class="err" id="loginErr" aria-live="polite"></div>
          <button class="btn big" type="submit">כניסה ללומדה ←</button>
        </form>
        <div class="card">
          <h2 style="color:var(--navy);font-weight:900;margin-bottom:14px">איך זה עובד?</h2>
          <ul class="how-list">
            <li><span class="n">1</span><div><b>בוחרים תפקיד.</b> פרקים 1 ו-2 לכולם, ואחריהם הפרקים של התחום שלכם.</div></li>
            <li><span class="n">2</span><div><b>לומדים פרק.</b> מסכים קצרים עם איורים, הדגמות מהשטח ו"ככה עושים / ככה לא עושים".</div></li>
            <li><span class="n">3</span><div><b>עונים על שאלות.</b> צריך ${C.passPct}% כדי לעבור, ושאלות הבטיחות המסומנות חייבות להיות נכונות. על כל תשובה מקבלים הסבר.</div></li>
            <li><span class="n">4</span><div><b>מקבלים תעודה.</b> בסוף המסלול מאשרים, מדפיסים ומחתימים את החונך.</div></li>
          </ul>
        </div>
      </div>`);

    const f = main.querySelector('#loginForm');
    const empIn = f.querySelector('#fEmp');
    // עובד חוזר: ממלאים את הפרטים שלו מהמכשיר
    empIn.addEventListener('change', () => {
      const prev = load(empIn.value.trim());
      if (prev) {
        f.querySelector('#fName').value = prev.profile.name;
        f.querySelector('#fSite').value = prev.profile.site || '';
        f.querySelector('#fRole').value = prev.profile.role;
        f.querySelector(`input[name=mode][value=${prev.profile.mode}]`).checked = true;
        toast('ברוכים השבים! ההתקדמות שלכם נטענה');
      }
    });
    f.querySelector('#fRole').addEventListener('change', (e) => {
      const r = C.roles.find(x => x.id === e.target.value);
      main.querySelector('#roleHint').textContent = r ? `המסלול שלכם: פרקים ${r.chapters.join(', ')}` : 'המסלול נבנה לפי התפקיד. החונך יכול לעזור לבחור.';
    });
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = f.querySelector('#fName').value.trim();
      const empId = empIn.value.trim();
      const role = f.querySelector('#fRole').value;
      const site = f.querySelector('#fSite').value.trim();
      const mode = f.querySelector('input[name=mode]:checked').value;
      const err = main.querySelector('#loginErr');
      if (name.length < 2) return (err.textContent = 'נא למלא שם מלא');
      if (!/^\d{2,12}$/.test(empId)) return (err.textContent = 'מספר עובד צריך להכיל ספרות בלבד');
      if (!role) return (err.textContent = 'נא לבחור תפקיד');
      const prev = load(empId);
      S = prev || { progress: {}, startedAt: Date.now() };
      S.profile = { name, empId, site, role, mode };
      save();
      if (!prev) sendEvent('start', { chapter: '', chapterTitle: 'התחלת לומדה' });
      dashboard();
    });
  }

  /* ───────── לוח מסלול ───────── */
  function ring(pct) {
    const r = 54, c = 2 * Math.PI * r;
    return `<div class="ring"><svg width="128" height="128" viewBox="0 0 128 128" aria-hidden="true">
      <circle cx="64" cy="64" r="${r}" fill="none" stroke="#E3E8EF" stroke-width="12"/>
      <circle cx="64" cy="64" r="${r}" fill="none" stroke="var(--green)" stroke-width="12" stroke-linecap="round"
        stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct / 100)}"/></svg>
      <div class="val"><div>${pct}%<small>מהמסלול</small></div></div></div>`;
  }

  function chapCard(n, inPath) {
    const c = chapter(n);
    const pr = S.progress[n];
    const unlocked = isUnlocked(n);
    const isNext = inPath && nextChapter() === n;
    let st;
    if (pr && pr.passed) st = `<span class="status done">✓ עבר · ${pr.best}%</span>`;
    else if (!unlocked) st = `<span class="status lock">🔒 נעול</span>`;
    else if (pr && pr.attempts) st = `<span class="status fail">נסו שוב</span>`;
    else st = `<span class="status open">${isNext ? '▶ הבא בתור' : 'פתוח'}</span>`;
    return `<button class="chap ${unlocked ? '' : 'locked'} ${isNext ? 'next' : ''}" style="--c:${c.color}" data-ch="${n}" ${unlocked ? '' : 'aria-disabled="true"'}>
      <div class="thumb"><span class="num">${n}</span><span class="ico" aria-hidden="true">${c.icon}</span></div>
      <div class="body"><h3>${esc(c.title)}</h3><div class="sub">${esc(c.subtitle)}</div>
        <div class="meta"><span>⏱ ${c.minutes} דק' · ${c.quiz.length} שאלות</span>${st}</div></div>
    </button>`;
  }

  function dashboard() {
    const p = path();
    const done = p.filter(passed).length;
    const pct = Math.round(done / p.length * 100);
    const opt = optional();
    const nxt = nextChapter();
    const role = roleById(S.profile.role);
    const first = S.profile.name.split(' ')[0];
    const main = frame(`
      <div class="dash-head">
        ${ring(pct)}
        <div>
          <h1>${done === 0 ? `שלום ${esc(first)}, מתחילים!` : requiredDone() ? `כל הכבוד ${esc(first)}! 🎉` : `שלום ${esc(first)}, ממשיכים`}</h1>
          <p>${done} מתוך ${p.length} פרקים במסלול הושלמו. ${nxt ? `הפרק הבא: <b>${nxt}. ${esc(chapter(nxt).title)}</b>` : ''}</p>
          <div class="tags"><span class="tag">${esc(role.label)}</span><span class="tag orange">${S.profile.mode === 'refresh' ? '🔄 רענון' : '🌱 עובד/ת חדש/ה'}</span>${S.profile.site ? `<span class="tag">${esc(S.profile.site)}</span>` : ''}</div>
          <div style="margin-top:10px">${syncHtml()}</div>
        </div>
      </div>
      ${requiredDone() ? `<div class="banner win"><div class="grow"><div class="t">סיימתם את המסלול!</div>אפשר להפיק תעודת סיום ולהחתים את החונך.</div><button class="btn navy" id="toCert">🎓 לתעודה</button></div>` :
        nxt ? `<div class="no-print" style="margin-bottom:6px"><button class="btn big" id="cont">${done ? 'המשך' : 'התחלה'}: פרק ${nxt} ←</button></div>` : ''}
      <div class="section-title">המסלול שלי <span class="line"></span></div>
      <div class="chap-grid">${p.map(n => chapCard(n, true)).join('')}</div>
      ${opt.length ? `<div class="section-title">פרקים נוספים (רשות) <span class="line"></span></div>
        <p style="color:var(--muted);margin-top:-4px">${requiredDone() ? 'מומלץ להכיר גם את שאר תחומי המפעל.' : 'ייפתחו אחרי שתסיימו את המסלול.'}</p>
        <div class="chap-grid">${opt.map(n => chapCard(n, false)).join('')}</div>` : ''}
    `);
    main.querySelectorAll('[data-ch]').forEach(b => b.addEventListener('click', () => {
      const n = +b.dataset.ch;
      if (!isUnlocked(n)) return toast('קודם מסיימים את הפרקים הקודמים במסלול');
      openChapter(n);
    }));
    const cont = main.querySelector('#cont'); if (cont) cont.addEventListener('click', () => openChapter(nxt));
    const tc = main.querySelector('#toCert'); if (tc) tc.addEventListener('click', certificate);
    flush();
  }

  /* ───────── בלוקים של תוכן ───────── */
  function block(b) {
    const [t, a, b2, c2] = b;
    switch (t) {
      case 'p': return `<p>${a}</p>`;
      case 'h': return `<h3>${a}</h3>`;
      case 'caption': return `<div class="caption">${a}</div>`;
      case 'img': return `<figure class="fig"><img src="${img(a)}" alt="${esc(b2 || '')}" loading="lazy"><figcaption>${b2 || ''}</figcaption></figure>`;
      case 'img2': return `<div class="fig2">${[a, b2].map(([k, cap]) => `<figure class="fig"><img src="${img(k)}" alt="${esc(cap)}" loading="lazy"><figcaption>${cap}</figcaption></figure>`).join('')}</div>`;
      case 'tip': return `<div class="callout tip"><span class="ic">💡</span><div><span class="tt">טיפ</span>${a}</div></div>`;
      case 'warn': return `<div class="callout warn"><span class="ic">!</span><div><span class="tt">זהירות</span>${a}</div></div>`;
      case 'demo': return `<div class="callout demo"><span class="ic">▶</span><div><span class="tt">${a}</span>${b2}</div></div>`;
      case 'list': return `<ul class="blist">${a.map(x => `<li>${x}</li>`).join('')}</ul>`;
      case 'steps': return `<ol class="steps">${a.map(([tt, d]) => `<li><div><span class="st">${tt}</span>${d || ''}</div></li>`).join('')}</ol>`;
      case 'dodont': return `<div class="dodont">
          <div class="dd do"><h4><span class="ic">✔</span>ככה עושים</h4><ul>${a.map(x => `<li>${x}</li>`).join('')}</ul></div>
          <div class="dd dont"><h4><span class="ic">✘</span>ככה לא עושים</h4><ul>${b2.map(x => `<li>${x}</li>`).join('')}</ul></div></div>`;
      case 'table': return `<div class="tbl-wrap"><table class="t"><thead><tr>${a.map(x => `<th>${x}</th>`).join('')}</tr></thead>
          <tbody>${b2.map(r => `<tr>${r.map(x => `<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      case 'cards': return `<div class="cards">${a.map(([tt, k, d, col]) => `<div class="icard" style="--cc:${col}"><span class="k">${k}</span><h4>${tt}</h4><p>${d}</p></div>`).join('')}</div>`;
      case 'legend': return `<div class="legend">
          <div><span class="ic" style="background:var(--yellow);color:var(--navy)">💡</span><b>טיפ</b>שימושי לדעת</div>
          <div><span class="ic" style="background:var(--orange)">!</span><b>זהירות</b>כלל שאסור לפספס</div>
          <div><span class="ic" style="background:var(--green)">✔</span><b>נכון</b>ככה עושים</div>
          <div><span class="ic" style="background:var(--red)">✘</span><b>לא נכון</b>ככה לא עושים</div></div>`;
      case 'sizes': return `<div class="sizes">${a.map(([nm, mm, lvl]) => `<div class="size-row"><span class="nm">${nm}</span>
          <span class="stones">${Array.from({ length: 7 }, () => `<i style="width:${3 + lvl * 3}px;height:${3 + lvl * 3}px"></i>`).join('')}</span>
          <span class="mm">${mm} mm</span></div>`).join('')}</div>`;
      case 'chat': return `<div class="chat">${a.map(([w, txt]) => `<div class="bubble ${w === 'לקוח' ? 'cust' : 'emp'}"><span class="who">${w}</span>${txt}</div>`).join('')}</div>`;
      case 'water': return `<div class="lab" data-lab="water"><span class="lt">🧪 מעבדה קטנה</span><h4>מה קורה כשמוסיפים "רק קצת מים"?</h4>
          <div class="row"><div><label for="wR">ליטרים מים עודפים לכל קוב: <b id="wV">0</b></label>
            <input type="range" id="wR" min="0" max="30" step="1" value="0">
            <div style="margin-top:12px">חוזק הבטון</div><div class="meter"><i id="wM"></i></div>
            <div class="verdict" id="wT"></div></div>
            <div><div class="cube" id="wC" aria-hidden="true"></div></div></div>
          <div class="note">המחשה בלבד: הנקודות הכהות הן החורים שהמים העודפים משאירים כשהם מתאדים.</div></div>`;
      case 'density': return `<div class="lab" data-lab="density"><span class="lt">🧪 נסו בעצמכם</span><h4>מדדתם צפיפות. מה עושים?</h4>
          <div class="row"><div><label for="dR">צפיפות שנמדדה (ק"ג לליטר)</label><input type="range" id="dR" min="1.000" max="1.080" step="0.005" value="1.000"></div>
          <div class="big" id="dV">1.000</div></div>
          <div class="verdict" id="dT"></div>
          <div class="note">לפי ערכי ברירת המחדל בחוברת. את הגבולות בפועל קובע הטכנולוג במפעל.</div></div>`;
      case 'calc': return `<div class="lab" data-lab="calc"><span class="lt">🧮 מחשבון ערמה</span><h4>נפח × משקל מרחבי = טונות</h4>
          <div class="inputs"><label>נפח הערמה (קוב)<input id="cV" type="number" value="2000" min="0"></label>
          <label>משקל מרחבי (טון לקוב)<input id="cD" type="number" value="1.60" step="0.01" min="0"></label></div>
          <div class="big" id="cT" style="margin-top:12px"></div>
          <div class="note" id="cN"></div></div>`;
      default: return '';
    }
  }

  function wireLabs(root) {
    const w = root.querySelector('[data-lab=water]');
    if (w) {
      const r = w.querySelector('#wR'), cube = w.querySelector('#wC');
      // מיקומי החורים קבועים, כך שהגרירה מוסיפה חורים ולא "מקפיצה" אותם
      const spots = Array.from({ length: 60 }, (_, i) => ({ x: (i * 37 % 97) + 1, y: (i * 61 % 93) + 2, s: 4 + (i * 13 % 7) }));
      const draw = () => {
        const v = +r.value;
        w.querySelector('#wV').textContent = v;
        const holes = 6 + v * 1.8;
        cube.innerHTML = spots.slice(0, holes).map(s => `<i style="left:${s.x}%;top:${s.y}%;width:${s.s}px;height:${s.s}px"></i>`).join('');
        const strength = 100 - v * 1.6;
        const m = w.querySelector('#wM');
        m.style.width = strength + '%';
        m.style.background = v === 0 ? 'var(--green)' : v < 10 ? 'var(--yellow)' : 'var(--red)';
        const t = w.querySelector('#wT');
        t.textContent = v === 0 ? '✔ בדיוק לפי המתכון. החוזק כפי שתוכנן.' : v < 10 ? '⚠ נראה תקין, אבל החוזק כבר יורד.' : '✘ בטון חלש משמעותית. יתגלה רק אחרי 28 יום.';
        t.style.background = v === 0 ? 'rgba(46,160,90,.25)' : v < 10 ? 'rgba(240,181,5,.25)' : 'rgba(214,69,69,.3)';
      };
      r.addEventListener('input', draw); draw();
    }
    const d = root.querySelector('[data-lab=density]');
    if (d) {
      const r = d.querySelector('#dR');
      const zones = [
        [1.010, 'var(--green)', 'rgba(46,160,90,.3)', '✔ שימוש רגיל (עד 19 גרם מוצקים לליטר)'],
        [1.030, '#9BC34A', 'rgba(155,195,74,.3)', '✔ תיקון אוטומטי במחשב (19-57 גרם לליטר)'],
        [1.050, 'var(--yellow)', 'rgba(240,181,5,.3)', '⚠ הטכנולוג מקטין את שיעור המים הממוחזרים (57-95 גרם לליטר)'],
        [9, 'var(--red)', 'rgba(214,69,69,.35)', '✘ מעל 1.050: עוצרים ומדווחים לטכנולוג!']
      ];
      const draw = () => {
        const v = +r.value;
        d.querySelector('#dV').textContent = v.toFixed(3);
        const z = zones.find(z => v <= z[0] + 1e-9);
        const t = d.querySelector('#dT');
        t.textContent = z[3]; t.style.background = z[2];
        d.querySelector('#dV').style.color = z[1];
      };
      r.addEventListener('input', draw); draw();
    }
    const c = root.querySelector('[data-lab=calc]');
    if (c) {
      const draw = () => {
        const v = +c.querySelector('#cV').value || 0, den = +c.querySelector('#cD').value || 0;
        const tons = v * den;
        c.querySelector('#cT').textContent = tons.toLocaleString('he-IL', { maximumFractionDigits: 1 }) + ' טון';
        const base = v * 1.6;
        const diff = tons - base;
        c.querySelector('#cN').textContent = Math.abs(diff) < .5 ? 'שנו את המשקל המרחבי ל-1.50 וראו מה קורה.'
          : `לעומת משקל מרחבי של 1.60: הבדל של ${Math.abs(diff).toLocaleString('he-IL', { maximumFractionDigits: 0 })} טון, כ-${Math.round(Math.abs(diff) / 25)} משאיות.`;
      };
      c.querySelectorAll('input').forEach(i => i.addEventListener('input', draw)); draw();
    }
  }

  /* ───────── נגן פרק ───────── */
  let P = null; // { n, screens, i, t0, full }

  function buildScreens(c, full) {
    const intro = { kind: 'intro' };
    const rem = { kind: 'remember' };
    return full ? [intro].concat(c.screens, [rem]) : [intro, rem];
  }

  function openChapter(n) {
    const c = chapter(n);
    const full = S.profile.mode !== 'refresh';
    P = { n, full, screens: buildScreens(c, full), i: 0, t0: Date.now() };
    renderScreen();
  }

  function renderScreen() {
    const c = chapter(P.n);
    const sc = P.screens[P.i];
    const last = P.i === P.screens.length - 1;
    let body;
    if (sc.kind === 'intro') {
      body = `<h2>בפרק הזה תלמדו</h2>
        <div class="intro-meta">${c.procedure ? `<span class="m">הנוהל המלא: <b>${c.procedure}</b></span>` : ''}<span class="m">למי: <b>${esc(c.audience)}</b></span><span class="m">⏱ <b>${c.minutes}</b> דקות</span></div>
        <ul class="goals">${c.goals.map(g => `<li>${esc(g)}</li>`).join('')}</ul>
        <figure class="fig" style="margin-top:16px"><img src="${img(c.thumb)}" alt=""></figure>
        ${!P.full ? `<div class="callout tip"><span class="ic">🔄</span><div><span class="tt">מצב רענון</span>תעברו על הסיכום ותגשו למבחן. רוצים לעבור על כל התוכן? <button class="btn ghost" id="fullBtn" style="padding:6px 12px;margin-top:6px">הצג את כל התוכן</button></div></div>` : ''}`;
    } else if (sc.kind === 'remember') {
      body = `<div class="remember"><h2>📌 זכרו!</h2><ul>${c.remember.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>
        <p style="margin-top:16px">עכשיו ${c.quiz.length} שאלות. צריך <b>${C.passPct}%</b> כדי לעבור${c.quiz.some(q => q.critical) ? ', ו<b>שאלות הבטיחות המסומנות חייבות להיות נכונות</b>' : ''}. על כל תשובה תקבלו הסבר.</p>`;
    } else {
      body = `<h2>${sc.title}</h2>${sc.blocks.map(block).join('')}`;
    }
    const main = frame(`
      <div style="--c:${c.color}">
        <div class="player-head"><span class="badge">${c.num}</span><div><h1>${esc(c.title)}</h1><div class="sub">${esc(c.subtitle)}</div></div></div>
        <div class="dots" aria-hidden="true">${P.screens.map((_, i) => `<span class="${i < P.i ? 'on' : i === P.i ? 'cur' : ''}"></span>`).join('')}<span style="background:none;width:auto;height:auto;font-size:12px;color:var(--muted);line-height:10px">📝</span></div>
        <div class="progress"><i style="width:${(P.i + 1) / (P.screens.length + 1) * 100}%"></i></div>
        <article class="card screen">${body}</article>
        <div class="nav-row no-print">
          <button class="btn ghost" id="prev">${P.i === 0 ? '→ למסלול' : '→ הקודם'}</button>
          <span style="color:var(--muted);font-size:14px">מסך ${P.i + 1} מתוך ${P.screens.length}</span>
          <button class="btn ${last ? 'green' : ''}" id="next">${last ? 'למבחן 📝' : 'הבא ←'}</button>
        </div>
      </div>`);
    wireLabs(main);
    main.querySelector('#prev').addEventListener('click', () => { if (P.i === 0) dashboard(); else { P.i--; renderScreen(); } });
    main.querySelector('#next').addEventListener('click', () => { if (last) startQuiz(); else { P.i++; renderScreen(); } });
    const fb = main.querySelector('#fullBtn');
    if (fb) fb.addEventListener('click', () => { P.full = true; P.screens = buildScreens(c, true); P.i = 1; renderScreen(); });
  }

  /* ───────── מבחן ───────── */
  let Q = null; // { n, items, i, answers }

  function startQuiz() {
    const c = chapter(P.n);
    const items = shuffle(c.quiz).map(q => {
      const order = shuffle(q.o.map((_, i) => i));
      return { q, order, correct: order.indexOf(q.a) };
    });
    Q = { n: P.n, items, i: 0, answers: [], picked: null, checked: false };
    renderQuestion();
  }

  function renderQuestion() {
    const c = chapter(Q.n);
    const it = Q.items[Q.i];
    const main = frame(`
      <div style="--c:${c.color}">
        <div class="player-head"><span class="badge">${c.num}</span><div><h1>מבחן: ${esc(c.title)}</h1><div class="sub">בדקו את עצמכם</div></div></div>
        <div class="progress"><i style="width:${(Q.i) / Q.items.length * 100}%"></i></div>
        <article class="card screen">
          <div class="quiz-top"><span class="qcount">שאלה ${Q.i + 1} מתוך ${Q.items.length}</span>${it.q.critical ? '<span class="crit">⚠ שאלת בטיחות/איכות קריטית</span>' : ''}</div>
          <div class="qtext" id="qt">${esc(it.q.q)}</div>
          <div class="opts" role="radiogroup" aria-labelledby="qt">
            ${it.order.map((oi, k) => `<button class="opt" role="radio" aria-checked="false" data-k="${k}"><span class="l">${LETTERS[k]}</span><span>${esc(it.q.o[oi])}</span></button>`).join('')}
          </div>
          <div id="fb" aria-live="polite"></div>
        </article>
        <div class="nav-row no-print">
          <button class="btn ghost" id="back">→ חזרה לתוכן</button>
          <button class="btn" id="go" disabled>בדיקה</button>
        </div>
      </div>`);
    const opts = [...main.querySelectorAll('.opt')];
    const go = main.querySelector('#go');
    Q.picked = null; Q.checked = false;
    opts.forEach(o => o.addEventListener('click', () => {
      if (Q.checked) return;
      opts.forEach(x => { x.classList.remove('sel'); x.setAttribute('aria-checked', 'false'); });
      o.classList.add('sel'); o.setAttribute('aria-checked', 'true');
      Q.picked = +o.dataset.k; go.disabled = false;
    }));
    main.querySelector('#back').addEventListener('click', () => { P.i = P.screens.length - 1; renderScreen(); });
    go.addEventListener('click', () => {
      if (!Q.checked) {
        if (Q.picked == null) return;
        Q.checked = true;
        const ok = Q.picked === it.correct;
        Q.answers.push({ ok, critical: !!it.q.critical, q: it.q, picked: it.order[Q.picked] });
        opts.forEach((o, k) => { o.disabled = true; if (k === it.correct) o.classList.add('right'); else if (k === Q.picked) o.classList.add('wrong'); });
        main.querySelector('#fb').innerHTML = `<div class="feedback ${ok ? 'ok' : 'no'}"><span class="h">${ok ? '✔ נכון!' : '✘ לא בדיוק.'}</span>${esc(it.q.e)}</div>`;
        go.textContent = Q.i === Q.items.length - 1 ? 'לתוצאה ←' : 'לשאלה הבאה ←';
        go.focus();
      } else if (Q.i < Q.items.length - 1) { Q.i++; renderQuestion(); }
      else finishQuiz();
    });
  }

  function finishQuiz() {
    const c = chapter(Q.n);
    const correct = Q.answers.filter(a => a.ok).length;
    const total = Q.answers.length;
    const pct = Math.round(correct / total * 100);
    const critMiss = Q.answers.filter(a => a.critical && !a.ok).length;
    const ok = pct >= C.passPct && critMiss === 0;
    const pr = S.progress[Q.n] || { attempts: 0, best: 0, passed: false };
    pr.attempts++;
    pr.last = pct; pr.best = Math.max(pr.best || 0, pct); pr.ts = Date.now();
    const firstPass = ok && !pr.passed;
    if (ok) pr.passed = true;
    S.progress[Q.n] = pr; save();
    sendEvent('chapter', {
      chapter: Q.n, chapterTitle: c.title, score: pct, correct, total, attempt: pr.attempts,
      passed: ok, criticalMissed: critMiss, durationSec: Math.round((Date.now() - P.t0) / 1000),
      passedCount: path().filter(passed).length
    });
    if (ok && requiredDone() && !S.completedSent) { S.completedSent = true; save(); sendEvent('course_complete', { chapter: '', chapterTitle: 'סיום המסלול' }); }

    const wrong = Q.answers.filter(a => !a.ok);
    const nxt = nextChapter();
    let why = '';
    if (!ok) why = critMiss ? `${critMiss === 1 ? 'טעיתם בשאלה קריטית אחת' : `טעיתם ב-${critMiss} שאלות קריטיות`}. שאלות בטיחות ואיכות חייבות להיות נכונות.` : `צריך ${C.passPct}% כדי לעבור.`;
    const failTitle = pct >= C.passPct ? 'כמעט! רק שאלת הבטיחות' : pct >= 50 ? 'כמעט! עוד ניסיון' : 'כדאי לעבור שוב על התוכן';
    const main = frame(`
      <div style="--c:${c.color}">
        <article class="card result screen">
          <div class="emoji">${ok ? '🏆' : '💪'}</div>
          <h1 style="color:${ok ? 'var(--green)' : 'var(--navy)'}">${ok ? 'עברתם את הפרק!' : failTitle}</h1>
          <div class="score">${pct}%</div>
          <div class="why">${correct} תשובות נכונות מתוך ${total}. ${why}</div>
          ${wrong.length ? `<div class="review"><h3 style="color:var(--navy)">מה כדאי לחזק</h3>${wrong.map(a => `<div class="ri"><b>${a.critical ? '⚠ ' : ''}${esc(a.q.q)}</b><br>התשובה הנכונה: ${esc(a.q.o[a.q.a])}<br><span style="color:var(--muted)">${esc(a.q.e)}</span></div>`).join('')}</div>` : ''}
          <div class="nav-row" style="justify-content:center">
            ${ok ? `${requiredDone() && firstPass && !nxt ? `<button class="btn navy big" id="cert">🎓 לתעודת הסיום</button>` : nxt ? `<button class="btn big" id="nextCh">לפרק ${nxt}: ${esc(chapter(nxt).title)} ←</button>` : ''}
                    <button class="btn ghost" id="home">למסלול שלי</button>`
                 : `<button class="btn big" id="retry">🔄 נסו שוב</button><button class="btn ghost" id="review">חזרה לתוכן הפרק</button>`}
          </div>
          <div style="margin-top:14px">${syncHtml()}</div>
        </article>
      </div>`);
    if (ok) confetti();
    const on = (id, fn) => { const el = main.querySelector('#' + id); if (el) el.addEventListener('click', fn); };
    on('cert', certificate);
    on('nextCh', () => openChapter(nxt));
    on('home', dashboard);
    on('retry', startQuiz);
    on('review', () => { P.full = true; P.screens = buildScreens(c, true); P.i = 1; renderScreen(); });
  }

  /* ───────── תעודה ───────── */
  function certificate() {
    if (!requiredDone()) return dashboard();
    const p = S.profile;
    const role = roleById(p.role);
    const rows = path().map(n => { const pr = S.progress[n]; return `<tr><td>${n}</td><td>${esc(chapter(n).title)}</td><td>${pr.best}%</td><td>${fmtDate(pr.ts)}</td></tr>`; }).join('');
    const extra = optional().filter(passed);
    const doneTs = Math.max(...path().map(n => S.progress[n].ts));
    const main = frame(`
      ${!S.certAck ? `<div class="card no-print" style="margin-bottom:16px">
        <h2 style="color:var(--navy);font-weight:900;margin-bottom:8px">הצהרת העובד/ת</h2>
        <label style="display:flex;gap:10px;align-items:flex-start;cursor:pointer"><input type="checkbox" id="ack" style="width:22px;height:22px;margin-top:3px">
        <span>אני מאשר/ת שלמדתי את פרקי המסלול, קיבלתי הסבר והדגמה בעמדה, שאלתי את מה שלא היה ברור, ואפעל לפי הנהלים.</span></label>
        <div style="margin-top:12px"><button class="btn green" id="ackBtn" disabled>אישור והפקת תעודה</button></div></div>` : ''}
      <div class="cert" ${S.certAck ? '' : 'style="opacity:.35;filter:blur(1px)"'}>
        <div class="top"><img src="${img('img1')}" alt="שיכון ובינוי"><div class="seal">עבר/ה<br>בהצלחה</div></div>
        <h1>תעודת סיום הדרכה</h1>
        <div class="sub">ברוכים הבאים לעולם הבטון · לומדת ${p.mode === 'refresh' ? 'רענון' : 'קליטה'}</div>
        <div class="who">${esc(p.name)}</div>
        <div class="sub">מספר עובד ${esc(p.empId)} · ${esc(role.label)}${p.site ? ' · ' + esc(p.site) : ''}</div>
        <div class="tbl-wrap" style="margin-top:18px"><table class="t"><thead><tr><th>פרק</th><th>נושא</th><th>ציון</th><th>תאריך</th></tr></thead><tbody>${rows}</tbody></table></div>
        ${extra.length ? `<div class="sub">פרקי רשות שהושלמו: ${extra.map(n => n + '. ' + esc(chapter(n).title)).join(' · ')}</div>` : ''}
        <div class="decl">העובד/ת אישר/ה שלמד/ה את פרקי המסלול, קיבל/ה הסבר והדגמה בעמדה, שאל/ה את מה שלא היה ברור, ויפעל/תפעל לפי הנהלים. תאריך סיום: <b>${fmtDate(doneTs)}</b></div>
        <div class="sign-row"><div>חתימת העובד/ת</div><div>חתימת החונך</div><div>חתימת הממונה הישיר</div></div>
      </div>
      <div class="nav-row no-print"><button class="btn ghost" id="home">→ למסלול</button><button class="btn navy" id="print" ${S.certAck ? '' : 'disabled'}>🖨 הדפסה / שמירה כ-PDF</button></div>`);
    const ack = main.querySelector('#ack');
    if (ack) {
      const btn = main.querySelector('#ackBtn');
      ack.addEventListener('change', () => { btn.disabled = !ack.checked; });
      btn.addEventListener('click', () => { S.certAck = Date.now(); save(); sendEvent('declaration', { chapter: '', chapterTitle: 'אישור הצהרת עובד' }); confetti(); certificate(); });
    }
    main.querySelector('#home').addEventListener('click', dashboard);
    main.querySelector('#print').addEventListener('click', () => window.print());
  }

  /* ───────── מילון וכללי זהב ───────── */
  function modal(title, inner) {
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal-head"><h2>${title}</h2><button class="x" aria-label="סגירה">✕</button></div>${inner}</div>`;
    const close = () => { bg.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = e => { if (e.key === 'Escape') close(); };
    bg.addEventListener('click', e => { if (e.target === bg || e.target.closest('.x')) close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(bg);
    bg.querySelector('.x').focus();
    return bg;
  }

  function showGlossary() {
    const cards = list => list.map(([t, d]) => `<button class="flip" aria-label="${esc(t)}: ${esc(d)}"><div class="in"><div class="f">${esc(t)}</div><div class="b">${esc(d)}</div></div></button>`).join('');
    const m = modal('📖 מילון מונחים', `<p style="margin:0 0 10px;color:var(--muted)">לחצו על כרטיס כדי להפוך אותו.</p>
      <input class="gloss-search" placeholder="חיפוש מונח…" aria-label="חיפוש מונח"><div class="gloss">${cards(C.glossary)}</div>`);
    const grid = m.querySelector('.gloss');
    grid.addEventListener('click', e => { const f = e.target.closest('.flip'); if (f) f.classList.toggle('on'); });
    m.querySelector('.gloss-search').addEventListener('input', e => {
      const q = e.target.value.trim();
      grid.innerHTML = cards(C.glossary.filter(([t, d]) => !q || t.includes(q) || d.includes(q)));
    });
  }

  function showRules() {
    modal('⭐ עשרת כללי הזהב', `<ol class="rules">${C.goldenRules.map(r => `<li>${esc(r)}</li>`).join('')}</ol>`);
  }

  function showAnswerKey() {
    const tabs = C.chapters.map(c => `<button class="key-tab" data-k="${c.num}" style="--c:${c.color}">${c.num}</button>`).join('');
    const body = n => {
      const c = chapter(n);
      const roles = C.roles.filter(r => r.chapters.includes(n) && r.id !== 'all').map(r => r.label).join(' · ');
      return `<h3 style="color:var(--navy);margin:4px 0 2px">${n}. ${esc(c.title)}</h3>
        <div style="color:var(--muted);font-size:14px;margin-bottom:10px">${c.quiz.length} שאלות · ${c.quiz.filter(q => q.critical).length} קריטיות · במסלול של: ${esc(roles)}</div>
        ${c.quiz.map((q, i) => `<div class="key-q"><div class="kq">${i + 1}. ${esc(q.q)} ${q.critical ? '<span class="crit">⚠ קריטית</span>' : ''}</div>
          <ol class="key-opts">${q.o.map((o, j) => `<li class="${j === q.a ? 'ok' : ''}">${j === q.a ? '✔ ' : ''}${esc(o)}</li>`).join('')}</ol>
          <div class="ke">💬 ${esc(q.e)}</div></div>`).join('')}`;
    };
    const m = modal('🔑 מפתח תשובות', `<div class="key-tabs">${tabs}</div><div id="kb"></div>`);
    const show = n => {
      m.querySelector('#kb').innerHTML = body(n);
      m.querySelectorAll('.key-tab').forEach(t => t.classList.toggle('on', +t.dataset.k === n));
    };
    m.querySelector('.key-tabs').addEventListener('click', e => { const t = e.target.closest('.key-tab'); if (t) show(+t.dataset.k); });
    show(P ? P.n : 1);
  }

  /* ───────── מנהלים ───────── */
  function managerLogin() {
    if (!hasBackend()) {
      modal('כניסת מנהלים', `<p>הלומדה עדיין לא מחוברת לגיליון התוצאות.</p><p style="color:var(--muted)">כדי לחבר: פרסמו את הסקריפט של Google Apps Script לפי ההוראות בקובץ README, והגדירו את כתובתו ב-CONFIG.apiUrl, או פתחו את הלומדה דרך כתובת הסקריפט עצמה.</p>`);
      return;
    }
    const saved = sessionStorageGet('mgr');
    if (saved) return managerView(saved);
    const m = modal('🔐 כניסת מנהלים', `<form id="mf"><div class="field"><label for="mp">סיסמת מנהלים</label><input id="mp" type="password" autocomplete="current-password" required></div>
      <div class="err" id="me"></div><button class="btn navy" type="submit">כניסה</button></form>`);
    m.querySelector('#mp').focus();
    m.querySelector('#mf').addEventListener('submit', async e => {
      e.preventDefault();
      const pw = m.querySelector('#mp').value;
      const er = m.querySelector('#me'); er.textContent = 'בודק…';
      try {
        const r = await api('results', { password: pw });
        if (!r.ok) { er.textContent = r.error === 'auth' ? 'סיסמה שגויה' : 'שגיאה: ' + r.error; return; }
        sessionStorageSet('mgr', pw); m.remove(); managerView(pw, r.rows);
      } catch (x) { er.textContent = 'אין חיבור לשרת. נסו שוב.'; }
    });
  }
  function sessionStorageGet(k) { try { return sessionStorage.getItem(KEY + k); } catch (e) { return null; } }
  function sessionStorageSet(k, v) { try { sessionStorage.setItem(KEY + k, v); } catch (e) { } }

  function aggregate(rows) {
    const by = {};
    rows.forEach(r => {
      const id = String(r.empId);
      const e = by[id] || (by[id] = { empId: id, name: r.name, role: r.role, roleLabel: r.roleLabel, site: r.site, mode: r.mode, chapters: {}, last: '', declared: false, attempts: 0 });
      e.name = r.name || e.name; e.role = r.role || e.role; e.roleLabel = r.roleLabel || e.roleLabel; e.site = r.site || e.site; e.mode = r.mode || e.mode;
      if (!e.last || r.ts > e.last) e.last = r.ts;
      if (r.type === 'declaration') e.declared = true;
      if (r.type === 'chapter') {
        e.attempts++;
        const ch = e.chapters[r.chapter] || (e.chapters[r.chapter] = { best: 0, passed: false, attempts: 0, ts: '' });
        ch.attempts++; ch.best = Math.max(ch.best, +r.score || 0); ch.passed = ch.passed || r.passed === true || r.passed === 'TRUE' || r.passed === 'כן';
        if (r.ts > ch.ts) ch.ts = r.ts;
      }
    });
    return Object.values(by).map(e => {
      const req = roleById(e.role).chapters;
      e.req = req;
      e.done = req.filter(n => e.chapters[n] && e.chapters[n].passed).length;
      const scores = Object.values(e.chapters).filter(c => c.passed).map(c => c.best);
      e.avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
      e.complete = e.done === req.length;
      return e;
    }).sort((a, b) => (b.last > a.last ? 1 : -1));
  }

  async function managerView(pw, rows) {
    S && save();
    const main = frame(`<div class="card"><h2 style="color:var(--navy)">טוען נתונים…</h2></div>`, { hideMgr: true });
    if (!rows) {
      try { const r = await api('results', { password: pw }); if (!r.ok) throw new Error(r.error); rows = r.rows; }
      catch (e) { try { sessionStorage.removeItem(KEY + 'mgr'); } catch (x) { } main.innerHTML = '<div class="card">לא ניתן לטעון נתונים. נסו להתחבר מחדש.</div>'; return; }
    }
    const data = aggregate(rows);
    const roles = [...new Set(data.map(d => d.role))];
    const html = `
      <div class="player-head"><span class="badge" style="--c:var(--navy)">📊</span><div><h1>לוח מעקב מנהלים</h1><div class="sub">התקדמות העובדים בלומדה, לפי תפקיד ומסלול</div></div></div>
      <div class="mgr-stats">
        <div class="stat"><div class="v">${data.length}</div><div class="k">עובדים שהתחילו</div></div>
        <div class="stat"><div class="v" style="color:var(--green)">${data.filter(d => d.complete).length}</div><div class="k">סיימו את המסלול</div></div>
        <div class="stat"><div class="v" style="color:var(--orange)">${data.filter(d => !d.complete).length}</div><div class="k">בתהליך</div></div>
        <div class="stat"><div class="v">${(() => { const a = data.filter(d => d.avg != null); return a.length ? Math.round(a.reduce((s, d) => s + d.avg, 0) / a.length) + '%' : '—'; })()}</div><div class="k">ציון ממוצע (פרקים שעברו)</div></div>
      </div>
      <div class="mgr-tools no-print">
        <input id="ms" placeholder="חיפוש לפי שם או מספר עובד…" aria-label="חיפוש">
        <select id="mr" aria-label="סינון תפקיד"><option value="">כל התפקידים</option>${roles.map(r => `<option value="${r}">${esc(roleById(r).label)}</option>`).join('')}</select>
        <select id="mst" aria-label="סינון סטטוס"><option value="">כל הסטטוסים</option><option value="done">סיימו</option><option value="prog">בתהליך</option></select>
        <button class="btn navy" id="csv">⬇ ייצוא לאקסל</button>
        <button class="btn ghost" id="refresh">רענון</button>
        <button class="btn ghost" id="out">יציאה</button>
      </div>
      <div class="tbl-wrap"><table class="t" id="mt"><thead><tr><th>שם</th><th>מס' עובד</th><th>תפקיד</th><th>אתר</th><th>התקדמות</th><th>ציון ממוצע</th><th>סטטוס</th><th>עדכון אחרון</th></tr></thead><tbody></tbody></table></div>
      <p style="color:var(--muted);font-size:14px">לחצו על שורה כדי לראות פירוט לפי פרקים. הנתונים המלאים נמצאים גם בגיליון Google Sheets.</p>`;
    main.innerHTML = ''; main.appendChild(h(html));
    const tb = main.querySelector('#mt tbody');
    const filt = () => {
      const q = main.querySelector('#ms').value.trim(), r = main.querySelector('#mr').value, st = main.querySelector('#mst').value;
      return data.filter(d => (!q || (d.name || '').includes(q) || d.empId.includes(q)) && (!r || d.role === r) && (!st || (st === 'done') === d.complete));
    };
    const draw = () => {
      const list = filt();
      tb.innerHTML = list.length ? list.map((d, i) => `
        <tr class="clickable" data-i="${i}"><td>${esc(d.name)}</td><td>${esc(d.empId)}</td><td>${esc(d.roleLabel || roleById(d.role).label)}</td><td>${esc(d.site || '')}</td>
          <td>${d.done}/${d.req.length}<span class="mini-bar"><i style="width:${d.done / d.req.length * 100}%"></i></span></td>
          <td>${d.avg != null ? d.avg + '%' : '—'}</td>
          <td>${d.complete ? `<span class="status done">✓ סיים${d.declared ? ' + הצהרה' : ''}</span>` : '<span class="status open">בתהליך</span>'}</td>
          <td>${fmtDate(d.last)}</td></tr>`).join('') : '<tr><td colspan="8" style="text-align:center;color:var(--muted)">אין נתונים להצגה</td></tr>';
      tb.querySelectorAll('tr.clickable').forEach(tr => tr.addEventListener('click', () => {
        const nx = tr.nextElementSibling;
        if (nx && nx.classList.contains('detail')) { nx.remove(); return; }
        const d = list[+tr.dataset.i];
        const chips = d.req.concat(Object.keys(d.chapters).map(Number).filter(n => !d.req.includes(n))).map(n => {
          const ch = d.chapters[n];
          const cls = !ch ? 'none' : ch.passed ? 'ok' : 'no';
          return `<span class="cchip ${cls}" title="${ch ? ch.attempts + ' ניסיונות' : 'לא התחיל'}">${n}. ${esc(chapter(n).title)}${ch ? ' · ' + ch.best + '%' + (ch.attempts > 1 ? ` (${ch.attempts} ניסיונות)` : '') : ''}</span>`;
        }).join('');
        tr.insertAdjacentHTML('afterend', `<tr class="detail"><td colspan="8"><div class="chips-row">${chips}</div></td></tr>`);
      }));
    };
    ['ms', 'mr', 'mst'].forEach(id => main.querySelector('#' + id).addEventListener('input', draw));
    main.querySelector('#csv').addEventListener('click', () => exportCsv(filt()));
    main.querySelector('#refresh').addEventListener('click', () => managerView(pw));
    main.querySelector('#out').addEventListener('click', () => { try { sessionStorage.removeItem(KEY + 'mgr'); } catch (e) { } S ? dashboard() : login(); });
    draw();
  }

  function exportCsv(list) {
    const head = ['שם', 'מספר עובד', 'תפקיד', 'אתר', 'סוג הדרכה', 'פרקים שעברו', 'פרקים במסלול', 'ציון ממוצע', 'סיים מסלול', 'הצהרה', 'עדכון אחרון']
      .concat(C.chapters.map(c => `פרק ${c.num}`));
    const lines = list.map(d => [d.name, d.empId, d.roleLabel || roleById(d.role).label, d.site, d.mode === 'refresh' ? 'רענון' : 'קליטה', d.done, d.req.length, d.avg != null ? d.avg : '', d.complete ? 'כן' : 'לא', d.declared ? 'כן' : 'לא', fmtDate(d.last)]
      .concat(C.chapters.map(c => { const ch = d.chapters[c.num]; return ch ? (ch.passed ? ch.best : 'נכשל ' + ch.best) : ''; })));
    const cell = v => { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    // BOM כדי שאקסל יזהה עברית ב-UTF-8
    const csv = '﻿' + [head].concat(lines).map(r => r.map(cell).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `לומדת-בטון-תוצאות-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
  }

  /* ───────── הפעלה ───────── */
  const last = store.get('last', null);
  const prev = last && load(last);
  if (prev && prev.profile) { S = prev; dashboard(); } else login();
  flush();
})();
