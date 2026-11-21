// המקום היחיד שקורא וכותב את הנתונים בטלפון.
// בעתיד (אפליקציה מותקנת או סנכרון) מחליפים רק את הקובץ הזה.
import { defaultState, migrate } from './schema.js';

const KEY = 'rina-v1';
let current = null;
let onError = () => {};

export function setErrorHandler(fn) { onError = fn; }

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

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(current)); }
  catch (e) { onError('שגיאה בשמירה! כדאי לשמור קובץ גיבוי'); }
}

export function replaceAll(data) {
  current = migrate(data);
  save();
}

/** מחיקת כל הנתונים וחזרה להתחלה */
export function resetAll() {
  current = defaultState();
  save();
}

export function exportJson() { return JSON.stringify(current, null, 1); }
