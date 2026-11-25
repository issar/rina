// סוגי טיפול שאבא מגדיר פעם אחת, וסימון טיפול שבוצע.
import { uid } from '../core/util.js';
import { addLog } from './log.js';

export const getServiceType = (S, id) => S.serviceTypes.find((t) => t.id === id) || null;

export function saveServiceType(S, { id, name, includes = [], dangers = [], engine = false }) {
  const t = { id: id || uid(), name, includes, dangers, engine };
  const i = S.serviceTypes.findIndex((x) => x.id === t.id);
  if (i >= 0) S.serviceTypes[i] = t; else S.serviceTypes.push(t);
  return t;
}

export function deleteServiceType(S, id) {
  S.serviceTypes = S.serviceTypes.filter((t) => t.id !== id);
}

/** סימון טיפול שבוצע. hours רלוונטי רק לטיפול מנוע. */
export function markServiceDone(S, id, hours = null, now = Date.now()) {
  const t = getServiceType(S, id);
  if (!t) return null;
  if (t.engine) {
    const h = hours ?? S.hours;
    if (h != null) {
      S.lastServiceHours = h;
      if (S.hours == null || h > S.hours) S.hours = h;
    }
  }
  if (t.dangers.length) {
    S.pendingDangers = { name: t.name, date: now, items: t.dangers.map((text) => ({ text, ok: false })) };
  }
  addLog(S, 'service', `${t.name}${t.engine && S.lastServiceHours != null ? ` (בשעה ${S.lastServiceHours})` : ''}`, now);
  return t;
}

/** סימון בדיקה אחרי טיפול. מחזיר true כשכל הבדיקות הושלמו. */
/** "סמן הכול" בבדיקות אחרי טיפול */
export function checkAllDangers(S, now = Date.now()) {
  const p = S.pendingDangers;
  if (!p) return;
  addLog(S, 'resolve', `נבדק אחרי ${p.name}: ${p.items.map((x) => x.text).join(', ')}`, now);
  S.pendingDangers = null;
}

export function toggleDangerCheck(S, index, now = Date.now()) {
  const p = S.pendingDangers;
  if (!p || !p.items[index]) return false;
  p.items[index].ok = !p.items[index].ok;
  if (p.items.every((x) => x.ok)) {
    addLog(S, 'resolve', `נבדק אחרי ${p.name}: ${p.items.map((x) => x.text).join(', ')}`, now);
    S.pendingDangers = null;
    return true;
  }
  return false;
}
