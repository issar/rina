// ניווט בין מסכים, כולל כפתור החזרה של אנדרואיד.
// מסך = פונקציה שמקבלת params ומחזירה {title, html}, או null כדי לחזור לבית.
// טקסט שמקלידים נשמר כטיוטה לכל מסך, וחוזר גם אחרי "חזרה". פעולה שמשתמשת בטקסט
// קוראת ל-clearDraft() (או render({keepFields:false})) כדי שהטיוטה לא תחזור אחרי השמירה.
import { getDraft, setDraftField, clearDraft as clearDraftKey, clearAllDrafts } from './store.js';
export { clearAllDrafts };

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
  app.addEventListener('input', (e) => {
    const el = e.target;
    if (!el.id || !el.matches('input, textarea') || el.type === 'password' || el.type === 'file') return;
    setDraftField(draftKey(), el.id, el.value);
  });
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

/** שם המסך שמוצג עכשיו */
export const currentScreen = () => stack[stack.length - 1].name;

function draftKey(cur = stack[stack.length - 1]) {
  return `${cur.name}|${JSON.stringify(cur.params || {})}`;
}
/** הטקסט במסך הנוכחי נשמר או נוצל, ולכן לא צריך להחזיר אותו */
export function clearDraft() { clearDraftKey(draftKey()); }

/** keepFields: false כשהפעולה כבר השתמשה בטקסט שהוקלד ורוצים שדות ריקים */
export function render({ keepFields = true } = {}) {
  const cur = stack[stack.length - 1];
  const fn = screens[cur.name];
  if (!fn) throw new Error(`מסך לא קיים: ${cur.name}`);
  const out = fn(cur.params || {});
  if (!out) { if (stack.length > 1) goHome(); return; }
  // רענון של אותו מסך (למשל אחרי סימון) לא מוחק טקסט שכבר הוקלד
  if (!keepFields) clearDraftKey(draftKey(cur));
  const keep = keepFields && cur === lastRendered ? collectFields(els.app) : {};
  els.title.textContent = out.title;
  els.back.hidden = stack.length <= 1;
  els.app.innerHTML = out.html;
  if (keepFields) restoreDraft(els.app, getDraft(draftKey(cur)));
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

// טיוטה מחזירים גם כשהיא ריקה: אם מחקו טקסט שהיה במסך, הוא נשאר מחוק
function restoreDraft(root, vals) {
  if (!vals) return;
  for (const [id, v] of Object.entries(vals)) {
    const el = root.querySelector(`#${CSS.escape(id)}`);
    if (el && el.type !== 'password') el.value = v;
  }
}

function restoreFields(root, vals) {
  for (const [id, v] of Object.entries(vals)) {
    const el = root.querySelector(`#${CSS.escape(id)}`);
    if (el && v !== '') el.value = v;
  }
}
