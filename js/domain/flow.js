// המסלול המודרך של ביקור: שלב אחרי שלב, דבר אחד בכל מסך.
// כל שלב מוגדר פעם אחת ב-STEPS, לפי הסדר. when קובע אם השלב רלוונטי עכשיו,
// ו-count קובע כמה מסכים יש לשלב (למשל מסך לכל בדיקה לפני התנעה).
// כדי להוסיף שלב: מוסיפים רשומה כאן במקום הנכון, ומסך תואם ב-features/flow.js.
import { closeGroups } from './visit.js';

const sail = (S) => !!S.visit?.sail;

export const STEPS = [
  { key: 'warnings', when: (S) => S.open.length > 0 || !!S.pendingDangers || !!S.lastAnomaly },
  { key: 'plan' },
  { key: 'work', when: (S) => !!S.visit?.work },
  { key: 'sailBlock', when: (S) => sail(S) && S.open.length > 0 },
  { key: 'pre', when: sail, count: (S) => S.lists.pre.length },
  { key: 'start', when: sail },
  { key: 'post', when: sail, count: (S) => S.lists.post.length },
  { key: 'sailing', when: sail },
  { key: 'openCheck', when: (S) => S.open.length > 0 },
  { key: 'close', count: (S) => closeGroups(S).length },
  { key: 'hours' },
  { key: 'fuel' },
  { key: 'anomaly' },
  { key: 'anomalyText', when: (S) => S.visit?.anomaly === true },
  { key: 'summary', when: (S) => S.visit?.anomaly !== true },
  { key: 'nextTime' },
  { key: 'done' },
];

const indexOf = (key) => STEPS.findIndex((s) => s.key === key);
const isActive = (S, def) => (def.when ? def.when(S) : true) && countOf(S, def) > 0;
export const countOf = (S, def) => (def.count ? def.count(S) : 1);
export const stepDef = (key) => STEPS[indexOf(key)];

/** השלב הראשון בביקור חדש */
export function firstStep(S) {
  return nextStep(S, null);
}

/** השלב הבא אחרי pos ({key, i}). pos=null מתחיל מההתחלה. */
export function nextStep(S, pos) {
  let k = pos ? indexOf(pos.key) : -1;
  if (pos) {
    const def = STEPS[k];
    if ((pos.i ?? 0) + 1 < countOf(S, def)) return { key: pos.key, i: (pos.i ?? 0) + 1 };
  }
  for (k = k + 1; k < STEPS.length; k++) {
    if (isActive(S, STEPS[k])) return { key: STEPS[k].key, i: 0 };
  }
  return null;
}

/** מיקום בתוך שלב עם כמה מסכים: "2 מתוך 5" */
export function progressOf(S, pos) {
  const def = stepDef(pos.key);
  const n = countOf(S, def);
  return n > 1 ? { current: (pos.i ?? 0) + 1, total: n } : null;
}
