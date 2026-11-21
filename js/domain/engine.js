// חישובי מנוע: שעות, טיפול הבא, דלק.
import { round1 } from '../core/util.js';
import { addLog } from './log.js';

/** מתי טיפול המנוע הבא וכמה שעות נשארו. null אם עוד לא הוזנו שעות. */
export function serviceInfo(S) {
  if (S.hours == null) return null;
  const every = S.settings.serviceEvery;
  // טיפול שנעשה ליד כפולה של 100 נחשב לטיפול של אותה כפולה
  const base = S.lastServiceHours != null ? S.lastServiceHours : Math.floor(S.hours / every) * every;
  const next = Math.round(base / every) * every + every;
  const left = round1(next - S.hours);
  return { next, left, level: left <= 0 ? 'alert' : left <= 10 ? 'warn' : 'good' };
}

/** כמה שעות מנוע עברו מאז התדלוק, ורמת האזהרה. */
export function fuelInfo(S) {
  if (S.hours == null || S.fuelFillHours == null) return null;
  const since = round1(S.hours - S.fuelFillHours);
  const { fuelSoft, fuelHard } = S.settings;
  return { since, level: since >= fuelHard ? 'alert' : since >= fuelSoft ? 'warn' : 'good' };
}

/** true אם המספר קטן מהשעות הקודמות (כנראה טעות הקלדה). */
export function isHoursDecrease(S, h) {
  return S.hours != null && h < S.hours;
}

/** עדכון שעות מנוע. בפעם הראשונה מניחים שהטיפול האחרון היה בכפולה של 100 שמתחת (אפשר לתקן בהגדרות). */
export function setHours(S, h) {
  S.hours = h;
  if (S.lastServiceHours == null) {
    const every = S.settings.serviceEvery;
    S.lastServiceHours = Math.floor(h / every) * every;
  }
}

export function markFueled(S, now = Date.now()) {
  if (S.hours == null) return false;
  S.fuelFillHours = S.hours;
  addLog(S, 'fuel', `תדלוק מלא בשעה ${S.hours}`, now);
  return true;
}
