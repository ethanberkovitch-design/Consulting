/**
 * לומדת "ברוכים הבאים לעולם הבטון": שרת התוצאות.
 *
 * הסקריפט עושה שלושה דברים:
 *  1. מגיש את הלומדה עצמה (קובץ index.html בפרויקט), כך שקישור אחד מספיק לעובדים.
 *  2. רושם כל תוצאה בגיליון "יומן תוצאות", ומעדכן שורה לכל עובד ב"סיכום עובדים".
 *  3. מחזיר את הנתונים ללוח המנהלים שבלומדה, רק עם סיסמת מנהלים.
 *
 * הקמה: ראו README.md. בקצרה: להריץ פעם אחת את setup(), ואז Deploy > Web app.
 */

const LOG_SHEET = 'יומן תוצאות';
const SUM_SHEET = 'סיכום עובדים';
const CHAPTERS = 12;

const LOG_HEADERS = ['זמן', 'סוג אירוע', 'שם', 'מספר עובד', 'אתר', 'תפקיד', 'קוד תפקיד', 'סוג הדרכה',
  'פרק', 'נושא', 'ציון', 'נכונות', 'שאלות', 'ניסיון', 'עבר', 'שאלות קריטיות שגויות', 'משך (שניות)',
  'פרקים שעברו', 'פרקים במסלול', 'מזהה אירוע'];

const SUM_HEADERS = ['מספר עובד', 'שם', 'תפקיד', 'אתר', 'סוג הדרכה', 'פרקים שעברו', 'פרקים במסלול',
  'סיים מסלול', 'הצהרת עובד', 'התחלה', 'עדכון אחרון']
  .concat(Array.from({ length: CHAPTERS }, (_, i) => 'פרק ' + (i + 1)));

/* ───── כניסות ───── */

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('ברוכים הבאים לעולם הבטון')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// כשהלומדה מאוחסנת מחוץ ל-Apps Script היא שולחת POST עם {action, payload}
function doPost(e) {
  let out;
  try {
    const body = JSON.parse(e.postData.contents);
    out = api(body.action, body.payload);
  } catch (err) {
    out = { ok: false, error: String(err && err.message || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

// נקרא גם ישירות מהדפדפן דרך google.script.run כשהלומדה מוגשת מכאן
function api(action, payload) {
  if (action === 'submit') return submitResult(payload || {});
  if (action === 'results') return getResults((payload || {}).password);
  return { ok: false, error: 'unknown-action' };
}

/* ───── רישום תוצאה ───── */

function submitResult(d) {
  const empId = clean(d.empId, 20);
  if (!/^\d{2,12}$/.test(empId)) return { ok: false, error: 'bad-emp' };

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const log = sheet(ss, LOG_SHEET, LOG_HEADERS);
    const eventId = clean(d.eventId, 40);

    // הדפדפן שולח שוב אירוע שלא קיבל עליו אישור, אז מוודאים שלא נרשם פעמיים
    if (eventId && log.getLastRow() > 1) {
      const col = LOG_HEADERS.length;
      const found = log.getRange(2, col, log.getLastRow() - 1, 1).createTextFinder(eventId).matchEntireCell(true).findNext();
      if (found) return { ok: true, duplicate: true };
    }

    const ts = new Date();
    const passed = d.passed === true;
    log.appendRow([
      ts, clean(d.type, 30), clean(d.name, 80), empId, clean(d.site, 80), clean(d.roleLabel, 80), clean(d.role, 30),
      d.mode === 'refresh' ? 'רענון' : 'קליטה',
      num(d.chapter), clean(d.chapterTitle, 80), num(d.score), num(d.correct), num(d.total), num(d.attempt),
      d.type === 'chapter' ? (passed ? 'כן' : 'לא') : '', num(d.criticalMissed), num(d.durationSec),
      num(d.passedCount), num(d.requiredCount), eventId
    ]);
    updateSummary(ss, d, empId, ts, passed);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function updateSummary(ss, d, empId, ts, passed) {
  const sum = sheet(ss, SUM_SHEET, SUM_HEADERS);
  let row = 0;
  if (sum.getLastRow() > 1) {
    const f = sum.getRange(2, 1, sum.getLastRow() - 1, 1).createTextFinder(empId).matchEntireCell(true).findNext();
    if (f) row = f.getRow();
  }
  if (!row) {
    row = sum.getLastRow() + 1;
    sum.getRange(row, 1).setNumberFormat('@');
    sum.getRange(row, 10).setValue(ts);
  }
  const values = sum.getRange(row, 1, 1, SUM_HEADERS.length).getValues()[0];
  values[0] = empId;
  values[1] = clean(d.name, 80);
  values[2] = clean(d.roleLabel, 80);
  values[3] = clean(d.site, 80);
  values[4] = d.mode === 'refresh' ? 'רענון' : 'קליטה';
  if (d.passedCount !== undefined) values[5] = num(d.passedCount);
  if (d.requiredCount !== undefined) values[6] = num(d.requiredCount);
  values[7] = values[5] !== '' && values[5] === values[6] ? 'כן' : 'לא';
  if (d.type === 'declaration') values[8] = 'אושרה ' + Utilities.formatDate(ts, Session.getScriptTimeZone(), 'dd/MM/yyyy');
  if (!values[9]) values[9] = ts;
  values[10] = ts;

  const ch = Number(d.chapter);
  if (d.type === 'chapter' && ch >= 1 && ch <= CHAPTERS) {
    const idx = 10 + ch;
    const prev = String(values[idx] || '');
    const prevBest = prev.startsWith('✓') ? Number(prev.replace(/\D/g, '')) : -1;
    // ציון שעבר לא נדרס בניסיון חוזר נמוך יותר
    if (passed && num(d.score) >= prevBest) values[idx] = '✓ ' + num(d.score) + '%';
    else if (!passed && prevBest < 0) values[idx] = '✗ ' + num(d.score) + '%';
  }
  sum.getRange(row, 1, 1, SUM_HEADERS.length).setValues([values]);
}

/* ───── לוח מנהלים ───── */

function getResults(password) {
  const expected = PropertiesService.getScriptProperties().getProperty('MANAGER_PASSWORD');
  if (!expected || String(password || '') !== expected) {
    Utilities.sleep(800); // מאט ניחוש סיסמאות
    return { ok: false, error: 'auth' };
  }
  const log = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LOG_SHEET);
  if (!log || log.getLastRow() < 2) return { ok: true, rows: [] };
  const vals = log.getRange(2, 1, log.getLastRow() - 1, LOG_HEADERS.length).getValues();
  const rows = vals.map(v => ({
    ts: v[0] instanceof Date ? v[0].toISOString() : String(v[0]),
    type: v[1], name: v[2], empId: String(v[3]), site: v[4], roleLabel: v[5], role: v[6],
    mode: v[7] === 'רענון' ? 'refresh' : 'new',
    chapter: v[8], score: v[10], passed: v[14] === 'כן'
  }));
  return { ok: true, rows: rows };
}

/* ───── הקמה ───── */

/** להריץ פעם אחת מהעורך: יוצר את הגיליונות וסיסמת מנהלים התחלתית. */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  sheet(ss, LOG_SHEET, LOG_HEADERS);
  sheet(ss, SUM_SHEET, SUM_HEADERS);
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('MANAGER_PASSWORD')) props.setProperty('MANAGER_PASSWORD', 'beton2026');
  Logger.log('הוקם. סיסמת המנהלים הנוכחית: ' + props.getProperty('MANAGER_PASSWORD') + '  (להחלפה: setManagerPassword)');
}

/** להחלפת סיסמה: לשנות את הערך כאן ולהריץ. */
function setManagerPassword() {
  const NEW_PASSWORD = 'החליפו-אותי';
  PropertiesService.getScriptProperties().setProperty('MANAGER_PASSWORD', NEW_PASSWORD);
  Logger.log('הסיסמה עודכנה.');
}

/* ───── עזרים ───── */

function sheet(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.setRightToLeft(true);
    sh.getRange(1, 1, 1, headers.length).setValues([headers])
      .setFontWeight('bold').setBackground('#1F3A5F').setFontColor('#FFFFFF');
    sh.setFrozenRows(1);
    if (name === LOG_SHEET) sh.getRange('D:D').setNumberFormat('@');
  }
  return sh;
}

// ערך שמתחיל ב- = + - @ ייקרא בגיליון כנוסחה, ולכן מנטרלים אותו
function clean(v, max) {
  let s = String(v == null ? '' : v).replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function num(v) {
  const n = Number(v);
  return isFinite(n) && v !== '' && v !== null && v !== undefined ? n : '';
}
