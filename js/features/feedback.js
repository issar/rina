// הערות לשיפור ודיווח על באגים: מסך הזנה (כתיבה או הקלטה), וכפתור עגול מרחף שפותח אותו מכל מקום.
// את הכפתור אפשר לגרור לכל מקום במסך, והמיקום נזכר בטלפון.
import { state, save, getUiPref, setUiPref } from '../core/store.js';
import { go, back, clearDraft, currentScreen } from '../core/router.js';
import { btn, inputWithMic, val, toast, esc } from '../core/ui.js';
import { fmtDate } from '../core/util.js';
import { addFeedback } from '../domain/feedback.js';

function feedback() {
  const S = state();
  return {
    title: 'הערה או באג',
    html: `<p class="step-q">מה לא עבד, חסר או מבלבל?</p>
      <p class="muted">אפשר לכתוב, או ללחוץ על המיקרופון ולדבר. איסר יקבל את זה.</p>
      ${inputWithMic('fbIn', 'למשל: הכפתור של... לא עשה כלום', true)}
      ${btn('sendFeedback', 'שלח הערה', { cls: 'ok', ico: '💬' })}
      ${(S.feedback || []).slice(0, 5).map((f) => `<div class="log-entry"><span class="when">${fmtDate(f.ts)}</span><br>${esc(f.text)}</div>`).join('')}`,
  };
}

const actions = {
  sendFeedback() {
    const item = addFeedback(state(), val('fbIn'));
    if (!item) return toast('לא נכתב כלום');
    save();
    clearDraft();
    toast('תודה! ההערה נשמרה');
    back(); // חוזרים למסך שבו היית
  },
};

/** הכפתור המרחף: לחיצה פותחת את מסך ההערות, גרירה מזיזה אותו */
export function initFab() {
  const fab = document.createElement('button');
  fab.id = 'fab';
  fab.type = 'button';
  fab.setAttribute('aria-label', 'הערה או באג');
  fab.textContent = '💬';
  document.body.appendChild(fab);

  const SIZE = 56, PAD = 8;
  const clamp = (x, y) => [
    Math.min(Math.max(PAD, x), window.innerWidth - SIZE - PAD),
    Math.min(Math.max(PAD, y), window.innerHeight - SIZE - PAD),
  ];
  const place = (x, y) => { [x, y] = clamp(x, y); fab.style.left = `${x}px`; fab.style.top = `${y}px`; return [x, y]; };
  const saved = getUiPref('fab');
  place(saved ? saved.x : PAD + 4, saved ? saved.y : window.innerHeight - SIZE - 90); // ברירת מחדל: שמאל למטה
  window.addEventListener('resize', () => place(parseFloat(fab.style.left), parseFloat(fab.style.top)));

  let start = null, moved = false;
  fab.addEventListener('pointerdown', (e) => {
    start = { px: e.clientX, py: e.clientY, x: parseFloat(fab.style.left), y: parseFloat(fab.style.top) };
    moved = false;
    fab.setPointerCapture(e.pointerId);
  });
  fab.addEventListener('pointermove', (e) => {
    if (!start) return;
    const dx = e.clientX - start.px, dy = e.clientY - start.py;
    if (!moved && Math.hypot(dx, dy) < 8) return; // תזוזה קטנה עדיין נחשבת לחיצה
    moved = true;
    fab.classList.add('dragging');
    place(start.x + dx, start.y + dy);
  });
  fab.addEventListener('pointerup', () => {
    if (!start) return;
    fab.classList.remove('dragging');
    if (moved) setUiPref('fab', { x: parseFloat(fab.style.left), y: parseFloat(fab.style.top) });
    else if (currentScreen() !== 'feedback') go('feedback');
    start = null;
  });
  fab.addEventListener('pointercancel', () => { start = null; fab.classList.remove('dragging'); });
}

export default { screens: { feedback }, actions };
