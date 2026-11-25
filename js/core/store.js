// המקום היחיד שקורא וכותב את הנתונים בטלפון.
// בעתיד (אפליקציה מותקנת או סנכרון) מחליפים רק את הקובץ הזה.
import { defaultState, migrate } from './schema.js';

const KEY = 'rina-v1';
let current = null;
let onError = () => {};

let onSave = () => {};

export function setErrorHandler(fn) { onError = fn; }
/** מי שצריך לדעת על כל שמירה (הסנכרון לענן) */
export function setSaveListener(fn) { onSave = fn; }

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    current = raw ? migrate(JSON.parse(raw)) : defaultState();
  } catch (e) {
    onError('לא הצלחתי לקרוא את הנתונים. כדאי לשחזר מגיבוי.');
    current = defaultState();
  }
  return current;
}

/** הנתונים הנוכחיים. פעולות משנות אותם ואז קוראות ל-save(). */
export function state() { return current; }

/** silent: שמירה שבאה מהענן, ולכן לא צריך לשלוח אותה בחזרה */
export function save({ silent = false } = {}) {
  try { localStorage.setItem(KEY, JSON.stringify(current)); }
  catch (e) { onError('שגיאה בשמירה! כדאי לשמור קובץ גיבוי'); }
  if (!silent) onSave();
}

export function replaceAll(data, { silent = false } = {}) {
  current = migrate(data);
  save({ silent });
}

/** מחיקת כל הנתונים וחזרה להתחלה */
export function resetAll() {
  current = defaultState();
  save();
}

// טיוטות: טקסט שהוקלד ועוד לא נשמר, לפי מסך. נשמר בטלפון בלבד (לא עולה לענן),
// כדי שלחיצה בטעות על "חזרה" או סגירת האפליקציה לא ימחקו אותו.
const DRAFTS = 'rina-drafts';
let drafts = null;
function draftsObj() {
  if (!drafts) { try { drafts = JSON.parse(localStorage.getItem(DRAFTS)) || {}; } catch { drafts = {}; } }
  return drafts;
}
function writeDrafts() { try { localStorage.setItem(DRAFTS, JSON.stringify(drafts)); } catch {} }
export function getDraft(key) { return draftsObj()[key] || null; }
export function setDraftField(key, id, value) { const d = draftsObj(); (d[key] ||= {})[id] = value; writeDrafts(); }
export function clearDraft(key) { const d = draftsObj(); if (d[key]) { delete d[key]; writeDrafts(); } }
export function clearAllDrafts() { drafts = {}; writeDrafts(); }

export function exportJson() { return JSON.stringify(current, null, 1); }
