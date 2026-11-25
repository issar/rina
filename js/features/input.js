// מסך כללי להזנת טקסט חופשי (הקלדה או הקלטה).
// כדי להוסיף סוג הזנה חדש: מוסיפים רשומה ל-MODES עם title, ph, save ו-apply.
import { state, save } from '../core/store.js';
import { back, clearDraft } from '../core/router.js';
import { btn, inputWithMic, val, toast } from '../core/ui.js';
import { addLog } from '../domain/log.js';
import { addOpenItem } from '../domain/openItems.js';
import { addBring } from '../domain/bring.js';
import { addProjectNote, addProjectBring } from '../domain/projects.js';

const MODES = {
  open: { title: 'מה נשאר פתוח?', ph: 'למשל: מכסה מנוע מפורק', save: 'שמור כפריט פתוח', done: 'נרשם. אזכיר לך',
    apply: (S, text) => addOpenItem(S, text) },
  fix: { title: 'מה תיקנת?', ph: 'למשל: החלפתי אבץ במנוע', save: 'שמור בהיסטוריה', done: 'נשמר בהיסטוריה',
    apply: (S, text) => addLog(S, 'fix', text) },
  bring: { title: 'מה להביא בפעם הבאה?', ph: 'למשל: שמן מנוע', save: 'הוסף לרשימה', done: 'נוסף לרשימת ההבאה',
    apply: (S, text) => addBring(S, text) },
  note: { title: 'הערה לפרויקט', ph: 'מה נעשה או מה חסר', save: 'שמור הערה', done: 'ההערה נשמרה',
    apply: (S, text, p) => addProjectNote(S, p.pid, text) },
  pbring: { title: 'מה להביא לפרויקט?', ph: 'למשל: בד לריפוד', save: 'הוסף לרשימת ההבאה', done: 'נוסף לרשימת ההבאה',
    apply: (S, text, p) => addProjectBring(S, p.pid, text) },
};

function input(p) {
  const m = MODES[p.mode];
  if (!m) return null;
  return {
    title: m.title,
    html: `<p class="muted">אפשר להקליד או ללחוץ על המיקרופון ולדבר.</p>
      ${inputWithMic('freeIn', m.ph, true)}
      ${btn('saveInput', m.save, { cls: 'ok', ico: '✓', data: { mode: p.mode, pid: p.pid } })}`,
  };
}

const actions = {
  saveInput(d) {
    const text = val('freeIn');
    if (!text) return toast('לא נכתב כלום');
    const m = MODES[d.mode];
    m.apply(state(), text, d);
    save();
    clearDraft();
    toast(m.done);
    back();
  },
};

export default { screens: { input }, actions };
