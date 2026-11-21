// המרה בין רשימות הסימון לבין טקסט לעריכה במסך ההגדרות.
import { lines } from '../core/util.js';

/** רשימת סגירה לטקסט: כותרת אזור בשורה שמתחילה ב-# */
export function closeListToText(close) {
  const out = [];
  let last = null;
  for (const c of close) {
    if (c.g !== last) { out.push('# ' + c.g); last = c.g; }
    out.push(c.t);
  }
  return out.join('\n');
}

export function textToCloseList(text) {
  let g = 'כללי';
  const out = [];
  for (const l of lines(text)) {
    if (l.startsWith('#')) g = l.replace(/^#+\s*/, '') || 'כללי';
    else out.push({ g, t: l });
  }
  return out;
}

export function setLists(S, { pre, post, close }) {
  S.lists.pre = lines(pre);
  S.lists.post = lines(post);
  S.lists.close = textToCloseList(close);
  // הסימונים של ביקור פעיל מבוססים על מיקום בשורה, ולכן מתאפסים כשהרשימה משתנה
  if (S.visit) { S.visit.pre = {}; S.visit.post = {}; S.visit.close = {}; }
}
