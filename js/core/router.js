// ניווט בין מסכים, כולל כפתור החזרה של אנדרואיד.
// מסך = פונקציה שמקבלת params ומחזירה {title, html}, או null כדי לחזור לבית.

const screens = {};
let stack = [{ name: 'home', params: {} }];
let els = null;

export function registerScreens(map) {
  for (const [name, fn] of Object.entries(map)) {
    if (screens[name]) throw new Error(`מסך כפול: ${name}`);
    screens[name] = fn;
  }
}

export function initRouter({ app, title, back }) {
  els = { app, title, back };
  back.addEventListener('click', () => history.back());
  window.addEventListener('popstate', () => { if (stack.length > 1) stack.pop(); render(); });
}

export function go(name, params = {}) {
  stack.push({ name, params });
  history.pushState({ d: stack.length }, '');
  render();
  window.scrollTo(0, 0);
}

export function goHome() {
  stack = [{ name: 'home', params: {} }];
  render();
  window.scrollTo(0, 0);
}

export const back = () => history.back();

/** keepFields: false כשהפעולה כבר השתמשה בטקסט שהוקלד ורוצים שדות ריקים */
export function render({ keepFields = true } = {}) {
  const cur = stack[stack.length - 1];
  const fn = screens[cur.name];
  if (!fn) throw new Error(`מסך לא קיים: ${cur.name}`);
  const out = fn(cur.params || {});
  if (!out) { if (stack.length > 1) goHome(); return; }
  // רענון של אותו מסך (למשל אחרי סימון) לא מוחק טקסט שכבר הוקלד
  const keep = keepFields && cur === lastRendered ? collectFields(els.app) : {};
  els.title.textContent = out.title;
  els.back.hidden = stack.length <= 1;
  els.app.innerHTML = out.html;
  restoreFields(els.app, keep);
  if (out.after) out.after(); // מסך יכול למלא שדות אחרי שהוצג
  lastRendered = cur;
}

let lastRendered = null;

function collectFields(root) {
  const vals = {};
  root.querySelectorAll('input[id]:not([type=file]), textarea[id]').forEach((el) => { vals[el.id] = el.value; });
  return vals;
}

function restoreFields(root, vals) {
  for (const [id, v] of Object.entries(vals)) {
    const el = root.querySelector(`#${CSS.escape(id)}`);
    if (el && v !== '') el.value = v;
  }
}
