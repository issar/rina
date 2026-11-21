// ביקור בסירה: התחלה, מה עושים היום, רשימות סימון וסיום.
import { addLog } from './log.js';
import { addBring } from './bring.js';
import { markFueled, setHours } from './engine.js';

export const CHECK_LISTS = ['pre', 'post', 'close'];

export function startVisit(S, now = Date.now()) {
  S.visit = { started: now, work: false, sail: false, pre: {}, post: {}, close: {}, fueled: false, anomaly: null };
}

export function toggleActivity(S, key) {
  if (!S.visit || !['work', 'sail'].includes(key)) return;
  S.visit[key] = !S.visit[key];
}

export function toggleCheck(S, list, index) {
  if (!S.visit || !CHECK_LISTS.includes(list)) return;
  S.visit[list][index] = !S.visit[list][index];
}

export function toggleFueled(S) {
  if (S.visit) S.visit.fueled = !S.visit.fueled;
}

export const isListDone = (S, list) => S.lists[list].every((_, i) => S.visit?.[list]?.[i]);
export const uncheckedCount = (S, list) => S.lists[list].filter((_, i) => !S.visit?.[list]?.[i]).length;

/** רשימת הסגירה מקובצת לפי אזורים: [{g, items: [{i, t}]}] */
export function closeGroups(S) {
  const groups = [];
  S.lists.close.forEach((c, i) => {
    let g = groups.find((x) => x.g === c.g);
    if (!g) groups.push((g = { g: c.g, items: [] }));
    g.items.push({ i, t: c.t });
  });
  return groups;
}

/** תשובה לשאלה "היה משהו חריג היום?": true, false, או null (לא ענה) */
export function setAnomaly(S, value) {
  if (S.visit) S.visit.anomaly = value;
}

/**
 * סיום ביקור. כל השדות אופציונליים.
 * summary: סיכום היום. אם סומן חריג, הסיכום נשמר גם כתזכורת לביקור הבא.
 */
export function finishVisit(S, { hours = null, next = '', summary = '' } = {}, now = Date.now()) {
  const v = S.visit;
  if (!v) return;
  if (hours != null) setHours(S, hours);
  if (v.fueled) markFueled(S, now);
  if (next) addBring(S, next, {}, now);
  const what = v.work && v.sail ? 'עבודה והפלגה' : v.work ? 'עבודה' : v.sail ? 'הפלגה' : 'ביקור';
  addLog(S, 'visit', `ביקור הסתיים (${what})${hours != null ? `, שעות מנוע ${hours}` : ''}`, now);
  if (v.anomaly === true) {
    const text = summary || 'היה משהו חריג (לא נכתב מה)';
    addLog(S, 'anomaly', `חריג: ${text}`, now);
    S.lastAnomaly = { text, date: now };
  } else if (summary) {
    addLog(S, 'summary', summary, now);
  } else if (v.anomaly === false) {
    addLog(S, 'summary', 'יום רגיל, בלי חריגים', now);
  }
  S.visit = null;
}

/** סגירת תזכורת החריג מהביקור הקודם */
export function dismissAnomaly(S, now = Date.now()) {
  if (!S.lastAnomaly) return;
  addLog(S, 'resolve', `טופל החריג: ${S.lastAnomaly.text}`, now);
  S.lastAnomaly = null;
}

/** מסמכים שהם "היום" לעומת "בפעם הקודמת" */
export const happenedThisVisit = (S, ts) => !!S.visit && ts >= S.visit.started;
