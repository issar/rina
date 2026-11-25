// היסטוריה מקובצת לפי ביקורים. כל ביקור הוא שורה עם תאריך, שעות ותמצית קצרה.
// לחיצה פותחת את כל מה שקרה בו. לחיצה ארוכה מציעה למחוק אותו (למשל ביקור ניסיון).
import { state, save } from '../core/store.js';
import { render } from '../core/router.js';
import { esc, ask, toast } from '../core/ui.js';
import { fmtTime } from '../core/util.js';
import { LOG_ICONS } from '../domain/log.js';
import { groupSessions, deleteSession } from '../domain/history.js';

const LONG_PRESS_MS = 650;

// שורה אחת קצרה: "יום רביעי 25.11 · 09:00" (השעה רק לביקור, כי יום בלי ביקור הוא כמה רישומים)
const shortDate = (ts) => new Date(ts).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'numeric' });
function when(g) {
  return `${shortDate(g.ts)}${g.visit ? ` · ${fmtTime(g.ts)}` : ''}`;
}

function sessionBlock(g) {
  const items = g.entries
    .map((l) => `<div class="log-entry"><span class="when">${fmtTime(l.ts)}</span> ${LOG_ICONS[l.kind] || '•'} ${esc(l.text)}</div>`)
    .join('');
  return `<details class="day" data-session="${esc(g.key)}" data-label="${esc(when(g))}">
    <summary>
      <span class="day-date">${esc(when(g))}</span>
      <span class="day-sum">${esc(g.summary.join(' · '))}</span>
    </summary>
    <div class="day-body">${items}</div>
  </details>`;
}

async function confirmDelete(el) {
  const ok = await ask(`למחוק מההיסטוריה את הביקור מ${el.dataset.label}? שעות מנוע וטיפולים שנרשמו בו לא משתנים.`,
    { yes: 'כן, למחוק', no: 'לא', danger: true });
  if (!ok) return;
  deleteSession(state(), el.dataset.session);
  save(); render();
  toast('הביקור נמחק מההיסטוריה');
}

/** לחיצה ארוכה על שורה של ביקור. לחיצה רגילה רק פותחת וסוגרת. */
function bindLongPress() {
  document.querySelectorAll('details.day > summary').forEach((sum) => {
    const el = sum.parentElement;
    let timer = null, fired = false;
    const cancel = () => { clearTimeout(timer); timer = null; };
    sum.addEventListener('pointerdown', () => {
      fired = false;
      timer = setTimeout(() => { fired = true; timer = null; navigator.vibrate?.(30); confirmDelete(el); }, LONG_PRESS_MS);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => sum.addEventListener(ev, cancel));
    sum.addEventListener('contextmenu', (e) => e.preventDefault()); // בלי תפריט של הדפדפן בלחיצה ארוכה
    sum.addEventListener('click', (e) => { if (fired) { e.preventDefault(); fired = false; } }); // לא לפתוח אחרי לחיצה ארוכה
  });
}

function history() {
  const S = state();
  if (!S.log.length) return { title: 'היסטוריה', html: '<p class="muted">עוד אין היסטוריה. כל מה שתסמן יירשם כאן.</p>' };
  return {
    title: 'היסטוריה',
    html: `<p class="muted">לחיצה על ביקור פותחת אותו. לחיצה ארוכה מוחקת אותו.</p>${groupSessions(S.log).map(sessionBlock).join('')}`,
    after: bindLongPress,
  };
}

export default { screens: { history }, actions: {} };
