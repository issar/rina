// פרויקטים.
import { state, save } from '../core/store.js';
import { render, back } from '../core/router.js';
import { btn, navBtn, card, inputWithMic, esc, val, toast, ask } from '../core/ui.js';
import { fmtDate } from '../core/util.js';
import { getProject, activeProjects, doneProjects, createProject, finishProject } from '../domain/projects.js';
import { bringForProject } from '../domain/bring.js';

function projects() {
  const S = state();
  const active = activeProjects(S);
  const done = doneProjects(S);
  return {
    title: 'פרויקטים',
    html: `
      ${active.length ? '' : '<p class="muted">אין פרויקטים פתוחים.</p>'}
      ${active.map((p) => navBtn('project', esc(p.name), { cls: 'secondary', ico: '📋', data: { id: p.id } })).join('')}
      <h2>פרויקט חדש</h2>
      ${inputWithMic('projIn', 'שם הפרויקט, למשל: ריפוד לסלון')}
      ${btn('addProject', 'פתח פרויקט', { ico: '+' })}
      ${done.length ? `<h2>הסתיימו</h2>${done.map((p) => `<p class="muted">✓ ${esc(p.name)}</p>`).join('')}` : ''}`,
  };
}

function project(params) {
  const S = state();
  const p = getProject(S, params.id);
  if (!p) return null;
  const toBring = bringForProject(S, p.id);
  return {
    title: p.name,
    html: `
      ${toBring.length ? card('warn', '🧳 להביא', toBring.map((b) => `<p>• ${esc(b.text)}</p>`).join('')) : ''}
      ${navBtn('input', 'צריך להביא לפרויקט', { cls: 'secondary', ico: '🧳', data: { mode: 'pbring', pid: p.id } })}
      ${navBtn('input', 'הוסף הערה', { cls: 'secondary', ico: '📝', data: { mode: 'note', pid: p.id } })}
      ${p.notes.length ? `<h2>מה נעשה</h2>${p.notes.map((n) => `<div class="log-entry"><div class="when">${fmtDate(n.ts)}</div>${esc(n.text)}</div>`).join('')}` : ''}
      ${btn('finishProject', 'הפרויקט הסתיים', { cls: 'ok', ico: '✓', data: { id: p.id } })}`,
  };
}

const actions = {
  addProject() {
    const name = val('projIn');
    if (!name) return toast('צריך לתת שם לפרויקט');
    createProject(state(), name);
    save(); render({ keepFields: false });
  },
  async finishProject(d) {
    const p = getProject(state(), d.id);
    if (!p || !(await ask(`לסמן את "${p.name}" כגמור?`))) return;
    finishProject(state(), d.id);
    save(); back();
  },
};

export default { screens: { projects, project }, actions };
