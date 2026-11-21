// מסלול הביקור: הגעה, מה עושים היום, עבודה, בדיקה לפני הפלגה, סיום.
import { state, save } from '../core/store.js';
import { go, goHome, render } from '../core/router.js';
import { btn, navBtn, card, checkRow, inputWithMic, esc, val, toast, ask } from '../core/ui.js';
import { num } from '../core/util.js';
import { openItemsCard, dangersCard, anomalyCard } from './widgets.js';
import { startVisit, toggleActivity, toggleCheck, toggleFueled, setAnomaly, isListDone, uncheckedCount, closeGroups, finishVisit } from '../domain/visit.js';
import { closeValve, openValve, isValveClosed, hasOpenItems } from '../domain/openItems.js';
import { isHoursDecrease } from '../domain/engine.js';

const listRow = (S, list, i, text) =>
  checkRow({ action: 'tick', data: { list, key: i }, text, done: S.visit[list][i] });

/* ---------- מסכים (כולם דורשים ביקור פעיל, אחרת חוזרים לבית) ---------- */

function arrive() {
  const S = state();
  if (!S.visit) return null;
  const nothing = !S.open.length && !S.pendingDangers && !S.lastAnomaly;
  return {
    title: 'הגעתי לסירה',
    html: `
      ${nothing ? card('good', '✓ הכול בסדר', '<p>לא נשאר שום דבר פתוח מהפעם הקודמת.</p>') : ''}
      ${openItemsCard(S, 'לפני הכול: נשארו דברים פתוחים')}
      ${anomalyCard(S)}
      ${dangersCard(S)}
      ${navBtn('today', 'המשך: מה עושים היום?', { ico: '➜' })}`,
  };
}

function today() {
  const S = state();
  const v = S.visit;
  if (!v) return null;
  return {
    title: 'מה עושים היום?',
    html: `
      <p class="muted">אפשר לבחור את שניהם.</p>
      <div class="toggle">
        <button class="${v.work ? 'on' : ''}" data-a="toggleDo" data-k="work"><span class="ico">🔧</span>עבודה על הסירה</button>
        <button class="${v.sail ? 'on' : ''}" data-a="toggleDo" data-k="sail"><span class="ico">⛵</span>הפלגה</button>
      </div>
      ${v.work ? navBtn('work', 'למסך העבודה', { ico: '🔧' }) : ''}
      ${v.sail ? navBtn('sail', 'בדיקה לפני הפלגה', { ico: '✅' }) : ''}
      <h2>בסוף היום</h2>
      ${navBtn('close', 'סיימתי, עוזב את הסירה', { cls: 'secondary', ico: '🔒' })}`,
  };
}

function work() {
  const S = state();
  if (!S.visit) return null;
  return {
    title: 'עבודה על הסירה',
    html: `
      ${isValveClosed(S)
        ? btn('valveOpen', 'פתחתי את ברז יניקת מי הים', { cls: 'ok', ico: '🚰' })
        : btn('valveClose', 'סגרתי ברז יניקת מי ים', { cls: 'danger', ico: '🚰' })}
      ${navBtn('input', 'השארתי משהו פתוח / מפורק', { cls: 'secondary', ico: '⚠️', data: { mode: 'open' } })}
      ${navBtn('input', 'תיקנתי משהו', { cls: 'secondary', ico: '🔧', data: { mode: 'fix' } })}
      ${navBtn('services', 'ביצעתי טיפול', { cls: 'secondary', ico: '🛠' })}
      ${navBtn('input', 'צריך להביא בפעם הבאה', { cls: 'secondary', ico: '🧳', data: { mode: 'bring' } })}
      ${openItemsCard(S, 'פתוח עכשיו')}`,
  };
}

function sail() {
  const S = state();
  if (!S.visit) return null;
  if (hasOpenItems(S)) {
    return {
      title: 'לפני הפלגה',
      html: `${openItemsCard(S, 'אי אפשר להפליג עדיין')}
        <p>קודם מטפלים במה שנשאר פתוח, ואז נפתחת הבדיקה.</p>`,
    };
  }
  const preDone = isListDone(S, 'pre');
  const ready = preDone && isListDone(S, 'post');
  return {
    title: 'בדיקה לפני הפלגה',
    html: `
      ${dangersCard(S)}
      <div class="group-title">לפני התנעה</div>
      ${S.lists.pre.map((t, i) => listRow(S, 'pre', i, t)).join('')}
      <div class="group-title">מיד אחרי התנעה</div>
      ${preDone
        ? S.lists.post.map((t, i) => listRow(S, 'post', i, t)).join('')
        : '<p class="muted">ייפתח אחרי שכל הבדיקות לפני ההתנעה מסומנות.</p>'}
      ${ready ? card('good', '✓ מוכן להפלגה', '<p>הפלגה נעימה!</p>') + btn('back', 'חזרה', { cls: 'ok' }) : ''}`,
  };
}

function close() {
  const S = state();
  const v = S.visit;
  if (!v) return null;
  return {
    title: 'סיום ועזיבה',
    html: `
      ${openItemsCard(S, 'לפני שעוזבים: נשארו דברים פתוחים')}
      ${closeGroups(S).map((g) => `<div class="group-title">${esc(g.g)}</div>${g.items.map((x) => listRow(S, 'close', x.i, x.t)).join('')}`).join('')}
      <h2>${v.sail ? 'שעות מנוע בשעון' : 'שעות מנוע (אם הונע)'}</h2>
      <input type="number" inputmode="decimal" id="hoursIn" placeholder="${S.hours ?? 'למשל 245'}">
      ${checkRow({ action: 'fuelToggle', text: '⛽ תדלקתי עד הסוף', done: v.fueled, flag: true })}
      <h2>סיכום היום</h2>
      <p class="question">היה משהו חריג היום?</p>
      <div class="toggle">
        <button class="${v.anomaly === false ? 'on' : ''}" data-a="answerAnomaly" data-v="no"><span class="ico">👍</span>לא, הכול רגיל</button>
        <button class="${v.anomaly === true ? 'on alarm' : ''}" data-a="answerAnomaly" data-v="yes"><span class="ico">❗</span>כן, היה משהו</button>
      </div>
      ${inputWithMic('summaryIn', v.anomaly === true ? 'מה היה חריג? למשל: המנוע התחמם' : 'סיכום קצר של היום (לא חובה)', true)}
      ${v.anomaly === true ? '<p class="muted">זה יופיע לך כתזכורת בביקור הבא.</p>' : ''}
      <h2>מה צריך לפעם הבאה?</h2>
      ${inputWithMic('nextIn', 'למשל: להביא פילטר שמן')}
      ${btn('finishVisit', 'סיום ביקור', { cls: 'ok', ico: '✓' })}`,
  };
}

/* ---------- פעולות ---------- */

const actions = {
  arrive() { startVisit(state()); save(); go('arrive'); },
  toggleDo(d) { toggleActivity(state(), d.k); save(); render(); },
  tick(d) { toggleCheck(state(), d.list, Number(d.key)); save(); render(); },
  fuelToggle() { toggleFueled(state()); save(); render(); },
  answerAnomaly(d) { setAnomaly(state(), d.v === 'yes'); save(); render(); },

  valveClose() { closeValve(state()); save(); render(); toast('נרשם: הברז סגור. אזכיר לך לפתוח'); },
  valveOpen() { openValve(state()); save(); render(); toast('הברז מסומן כפתוח'); },

  finishVisit() {
    const S = state();
    const left = uncheckedCount(S, 'close');
    if (left && !ask(`נשארו ${left} סעיפים לא מסומנים. לסיים בכל זאת?`)) return;
    if (hasOpenItems(S) && !ask('נשארו דברים פתוחים (באדום). הם יופיעו לך בפעם הבאה. לסיים?')) return;
    const summary = val('summaryIn');
    if (S.visit.anomaly === true && !summary) return toast('כתוב או הקלט מה היה חריג');
    if (S.visit.anomaly == null && !ask('לא ענית אם היה משהו חריג היום. לסיים בכל זאת?')) return;
    const hours = num(val('hoursIn'));
    if (hours != null && isHoursDecrease(S, hours) && !ask(`המספר ${hours} קטן מהקודם (${S.hours}). לשמור בכל זאת?`)) return;
    finishVisit(S, { hours, next: val('nextIn'), summary });
    save();
    goHome();
    toast('הביקור נשמר. להתראות!');
  },
};

export default { screens: { arrive, today, work, sail, close }, actions };
