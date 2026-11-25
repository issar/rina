// מסך "סנכרון בין מכשירים": התחברות פעם אחת בכל מכשיר, ומצב השמירה בענן.
import * as cloud from '../services/cloud.js';
import { sync } from '../services/syncInstance.js';
import { render } from '../core/router.js';
import { btn, card, esc, val, toast, ask } from '../core/ui.js';
import { fmtDate, fmtTime } from '../core/util.js';

function when(ts) { return ts ? `${fmtDate(ts)} ${fmtTime(ts)}` : 'עוד לא'; }

function cloudScreen() {
  const st = sync.status();
  if (!st.configured) {
    return { title: 'סנכרון', html: card('', 'הסנכרון עוד לא הוגדר', '<p>כרגע הנתונים נשמרים רק בטלפון הזה.</p>') };
  }
  if (!st.signedIn) {
    return {
      title: 'סנכרון',
      html: `<p class="step-q">מתחברים פעם אחת בכל טלפון או מחשב.</p>
        <p>אחרי זה כל מה שמזינים נשמר גם בענן, ואפשר לראות אותו מכל מכשיר.</p>
        ${st.error === 'auth' ? card('warn', 'צריך להתחבר מחדש', '') : ''}
        <label class="field" for="cEmail">מייל</label>
        <input type="email" id="cEmail" autocomplete="username" inputmode="email" dir="ltr">
        <label class="field" for="cPass">סיסמה</label>
        <input type="password" id="cPass" autocomplete="current-password" dir="ltr">
        ${btn('cloudSignIn', 'להתחבר', { cls: 'ok', ico: '☁️' })}`,
    };
  }
  const state = st.dirty
    ? card('warn', 'יש שינויים שעוד לא נשמרו בענן', `<p>${st.error === 'offline' ? 'אין רשת כרגע. זה יישמר לבד כשתחזור הרשת.' : 'נשמר עוד רגע.'}</p>`)
    : card('good', 'הכול שמור בענן ✓', `<p>סנכרון אחרון: ${esc(when(st.lastSync))}</p>`);
  return {
    title: 'סנכרון',
    html: `<p>מחובר בתור:<br><b dir="ltr">${esc(st.email)}</b></p>
      ${state}
      ${btn('cloudSyncNow', 'לסנכרן עכשיו', { cls: 'secondary', ico: '🔄' })}
      ${btn('cloudSignOut', 'להתנתק מהמכשיר הזה', { cls: 'secondary small' })}`,
  };
}

const actions = {
  async cloudSignIn() {
    const email = val('cEmail'), pass = document.getElementById('cPass').value;
    if (!email || !pass) return toast('צריך מייל וסיסמה');
    try {
      await cloud.signIn(email, pass);
    } catch (e) {
      return toast(e.name === 'AuthError' ? e.message : 'אין רשת. נסה שוב כשיש רשת');
    }
    toast('מחובר. מסנכרן...');
    render({ keepFields: false });
    const st = await sync.syncNow();
    toast(st.error ? 'הסנכרון לא הצליח. ננסה שוב בהמשך' : 'הכול שמור בענן ✓');
  },
  async cloudSyncNow() {
    const st = await sync.syncNow();
    toast(st.error === 'offline' ? 'אין רשת כרגע' : st.error ? 'צריך להתחבר מחדש' : 'הכול שמור בענן ✓');
  },
  async cloudSignOut() {
    const st = sync.status();
    const msg = st.dirty
      ? 'יש שינויים שעוד לא נשמרו בענן. אם תתנתק עכשיו, הם יישארו רק בטלפון הזה. להתנתק?'
      : 'להתנתק? הנתונים יישארו בטלפון ובענן.';
    if (!(await ask(msg, { yes: 'כן, להתנתק', danger: st.dirty }))) return;
    cloud.signOut();
    sync.signedOut();
    render();
  },
};

export default { screens: { cloud: cloudScreen }, actions };
