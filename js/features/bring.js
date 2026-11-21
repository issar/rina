// מסך "מה להביא לסירה".
import { state, save } from '../core/store.js';
import { render } from '../core/router.js';
import { btn, card, checkRow, inputWithMic, val, toast } from '../core/ui.js';
import { addBring, removeBring } from '../domain/bring.js';

function bring() {
  const S = state();
  return {
    title: 'מה להביא לסירה',
    html: `
      ${S.bring.length
        ? '<p class="muted">לוחצים על מה שכבר נלקח, והוא יורד מהרשימה.</p>'
        : card('good', 'אין מה להביא', '<p>הרשימה ריקה.</p>')}
      ${S.bring.map((b) => checkRow({ action: 'bringDone', data: { id: b.id }, text: b.text, sub: b.source })).join('')}
      <h2>להוסיף</h2>
      ${inputWithMic('bringIn', 'מה להביא?')}
      ${btn('addBring', 'הוסף', { cls: 'secondary', ico: '+' })}`,
  };
}

const actions = {
  bringDone(d) { removeBring(state(), d.id); save(); render(); },
  addBring() {
    const text = val('bringIn');
    if (!text) return toast('לא נכתב כלום');
    addBring(state(), text);
    save(); render({ keepFields: false });
  },
};

export default { screens: { bring }, actions };
