// פרויקטים חופשיים (ריפוד, חלון וכו').
import { uid } from '../core/util.js';
import { addLog } from './log.js';
import { addBring } from './bring.js';

export const getProject = (S, id) => S.projects.find((p) => p.id === id) || null;
export const activeProjects = (S) => S.projects.filter((p) => !p.done);
export const doneProjects = (S) => S.projects.filter((p) => p.done);

export function createProject(S, name, now = Date.now()) {
  const p = { id: uid(), name, done: false, created: now, notes: [] };
  S.projects.push(p);
  addLog(S, 'project', `פרויקט חדש: ${name}`, now);
  return p;
}

export function addProjectNote(S, id, text, now = Date.now()) {
  const p = getProject(S, id);
  if (!p) return;
  p.notes.unshift({ ts: now, text });
  addLog(S, 'project', `${p.name}: ${text}`, now);
}

export function addProjectBring(S, id, text, now = Date.now()) {
  const p = getProject(S, id);
  if (!p) return;
  addBring(S, text, { source: `לפרויקט: ${p.name}`, pid: p.id }, now);
}

export function finishProject(S, id, now = Date.now()) {
  const p = getProject(S, id);
  if (!p) return;
  p.done = true;
  S.bring = S.bring.filter((b) => b.pid !== p.id);
  addLog(S, 'project', `הסתיים: ${p.name}`, now);
}
