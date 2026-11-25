// המסלול המודרך של ביקור: מסך אחד לכל שלב, עם כפתור אחד ברור להמשך.
// סדר השלבים ומתי כל אחד מופיע: domain/flow.js. כאן רק איך כל שלב נראה.
import { state, save } from '../core/store.js';
import { go, goHome, render, clearAllDrafts } from '../core/router.js';
import { btn, navBtn, card, checkRow, inputWithMic, esc, val, toast, ask } from '../core/ui.js';
import { num } from '../core/util.js';
import { openItemsCard, dangersCard, anomalyCard } from './widgets.js';
import { firstStep, nextStep, prevStep, progressOf, stepAfter } from '../domain/flow.js';
import {
  startVisit, toggleActivity, setPos, setDraft, setFueled, setAnomaly, setCheck, checkAll, toggleListView,
  closeGroups, uncheckedCount, finishVisit,
} from '../domain/visit.js';
import { closeValve, openValve, isValveClosed, hasOpenItems } from '../domain/openItems.js';
import { isHoursDecrease } from '../domain/engine.js';

/* ---------- רכיבים של מסך שלב ---------- */

const nextBtn = (label = 'המשך', opts = {}) =>
  btn('flowNext', label, { ico: '➜', ...opts, data: { ...(opts.data || {}) } });

/** כפתור בתחתית כל רשימת סימון: מסמן את כל הרשימה וממשיך לשלב שאחריה */
const checkAllBtn = (list) =>
  `<div class="spacer"></div>${btn('flowCheckAll', 'סמן הכול והמשך', { cls: 'secondary', ico: '✓✓', data: { list } })}`;

const progress = (p) => (p ? `<p class="progress">${p.current} מתוך ${p.total}</p>` : '');

const bigQuestion = (text) => `<p class="step-q">${text}</p>`;

const choice = (action, items) => `<div class="choice">${items.map((it) =>
  `<button class="${it.cls || ''}" data-a="${action}" data-v="${it.v}"><span class="ico">${it.ico}</span>${it.label}</button>`).join('')}</div>`;

/** איור למסך ההפלגה: שמש, סירת מפרש שמתנדנדת וגלים שזזים (התנועה נעצרת למי שביקש פחות אנימציה) */
const SAIL_SVG = `<svg viewBox="0 0 360 220" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe3f5"/><stop offset="1" stop-color="#f4f1ea"/></linearGradient>
    <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a7fb0"/><stop offset="1" stop-color="#0b3d5c"/></linearGradient>
  </defs>
  <rect width="360" height="220" fill="url(#sky)"/>
  <circle cx="290" cy="58" r="30" fill="#ffd36b"/><circle cx="290" cy="58" r="42" fill="#ffd36b" opacity=".25"/>
  <g class="boat">
    <path d="M118 150 L232 150 L216 170 L134 170 Z" fill="#ffffff" stroke="#0b3d5c" stroke-width="3" stroke-linejoin="round"/>
    <line x1="176" y1="58" x2="176" y2="150" stroke="#0b3d5c" stroke-width="4" stroke-linecap="round"/>
    <path d="M180 62 L180 144 L228 144 Z" fill="#ffffff" stroke="#0b3d5c" stroke-width="3" stroke-linejoin="round"/>
    <path d="M172 70 L172 144 L130 144 Z" fill="#e8f2f8" stroke="#0b3d5c" stroke-width="3" stroke-linejoin="round"/>
    <path d="M176 58 L196 64 L176 70 Z" fill="#b3121b"/>
  </g>
  <g class="waves">
    <path d="M-40 168 q20 -10 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 V220 H-40 Z" fill="url(#sea)"/>
    <path class="w2" d="M-40 184 q20 -8 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 V220 H-40 Z" fill="#0b3d5c" opacity=".55"/>
  </g>
</svg>`;

/* ---------- השלבים ---------- */

const STEP_VIEWS = {
  warnings: (S) => ({
    title: 'לפני שמתחילים',
    html: `${bigQuestion('יש כמה דברים מהפעם הקודמת:')}
      ${openItemsCard(S, 'נשארו פתוחים')}
      ${anomalyCard(S)}
      ${dangersCard(S)}
      ${nextBtn()}`,
  }),

  plan: (S) => {
    const v = S.visit;
    const any = v.work || v.sail;
    return {
      title: 'מה עושים היום?',
      html: `${bigQuestion('אפשר לבחור אחד או את שניהם:')}
        <div class="toggle">
          <button class="${v.work ? 'on' : ''}" data-a="toggleDo" data-k="work"><span class="ico">🔧</span>עבודה על הסירה</button>
          <button class="${v.sail ? 'on' : ''}" data-a="toggleDo" data-k="sail"><span class="ico">⛵</span>הפלגה</button>
        </div>
        ${any ? nextBtn() : '<p class="muted center">בחר כדי להמשיך</p>'}`,
    };
  },

  work: (S) => ({
    title: 'עבודה על הסירה',
    html: `<p class="muted">לוחצים רק כשקורה משהו. בסוף העבודה לוחצים על הכפתור הירוק.</p>
      <p class="muted">ברז יניקת מי ים (לוחצים כשסוגרים או פותחים):</p>
      ${isValveClosed(S)
        ? btn('valveToggle', 'ברז יניקת מי ים: סגור', { cls: 'danger', ico: '⛔' })
        : btn('valveToggle', 'ברז יניקת מי ים: פתוח', { cls: 'ok', ico: '✓' })}
      ${navBtn('input', 'תיקנתי משהו', { cls: 'secondary', ico: '🔧', data: { mode: 'fix' } })}
      ${navBtn('services', 'ביצעתי טיפול', { cls: 'secondary', ico: '🛠' })}
      ${navBtn('input', 'השארתי משהו פתוח / מפורק', { cls: 'secondary', ico: '⚠️', data: { mode: 'open' } })}
      ${openItemsCard(S, 'פתוח עכשיו')}
      <div class="spacer"></div>
      ${nextBtn('סיימתי לעבוד', { cls: 'ok' })}`,
  }),

  sailBlock: (S) => ({
    title: 'רגע לפני ההפלגה',
    html: hasOpenItems(S)
      ? `${openItemsCard(S, 'אי אפשר להפליג עדיין')}<p>קודם מטפלים במה שנשאר פתוח.</p>`
      : `${card('good', '✓ הכול טופל', '<p>אפשר להמשיך לבדיקה לפני ההתנעה.</p>')}${nextBtn()}`,
  }),

  pre: (S, pos) => checkStep(S, pos, 'pre', 'בדיקה לפני התנעה'),

  start: () => ({
    title: 'התנעה',
    html: `${bigQuestion('כל הבדיקות עברו.<br>עכשיו אפשר להניע את המנוע.')}
      ${nextBtn('הנעתי את המנוע', { cls: 'ok' })}`,
  }),

  post: (S, pos) => checkStep(S, pos, 'post', 'מיד אחרי ההתנעה'),

  // מסך מעבר: סוף שלב היציאה. נשאר פתוח כל זמן ההפלגה, ובחזרה לוחצים על הכפתור האדום
  sailing: () => ({
    title: 'בים ⛵',
    html: `<div class="sail-scene" aria-hidden="true">${SAIL_SVG}</div>
      <p class="sail-title">הפלגה נעימה!</p>
      <p class="sail-sub">כל הבדיקות עברו. המסך הזה מחכה לך עד שתחזור.</p>
      <div class="spacer"></div>
      ${nextBtn('חזרתי לנמל', { cls: 'danger', ico: '⚓' })}
      ${btn('flowPrev', 'תיקון (חזרה אחורה)', { cls: 'secondary small', ico: '↩' })}`,
    // "חזרה" למעלה מוביל לבית (לבדוק טיפולים וכו'), ומשם "חזרה להפלגה" מחזיר לכאן
    backHome: true,
  }),

  openCheck: (S) => ({
    title: 'לפני שעוזבים',
    html: `${openItemsCard(S, 'שים לב, נשארו דברים פתוחים')}
      <p class="muted">אם זה בכוונה, אפשר להמשיך. זה יופיע לך בפעם הבאה.</p>
      ${nextBtn()}`,
  }),

  close: (S, pos) => {
    const groups = closeGroups(S);
    const g = groups[pos.i];
    return {
      title: `סגירת הסירה: ${esc(g.g)}`,
      html: `${pos.i === 0 && S.visit.sail ? '<p class="section-kick">⚓ ברוך שובך! עכשיו סוגרים את הסירה.</p>' : ''}
        ${progress(progressOf(S, pos))}
        ${g.items.map((x) => checkRow({ action: 'tick', data: { list: 'close', key: x.i }, text: x.t, done: S.visit.close[x.i] })).join('')}
        ${nextBtn()}
        ${checkAllBtn('close')}`,
    };
  },

  hours: (S) => ({
    title: 'שעות מנוע',
    html: `${bigQuestion('כמה שעות מראה השעון של המנוע?')}
      <input type="number" inputmode="decimal" id="hoursIn" class="big-input" value="${S.visit.draft.hours ?? ''}" placeholder="${S.hours ?? ''}">
      ${nextBtn('המשך', { data: { save: 'hours' } })}
      ${btn('flowSkipHours', 'המנוע לא הונע היום', { cls: 'secondary small' })}`,
  }),

  fuel: () => ({
    title: 'דלק',
    html: `${bigQuestion('תדלקת היום עד הסוף?')}
      ${choice('answerFuel', [{ v: 'no', ico: '✕', label: 'לא' }, { v: 'yes', ico: '⛽', label: 'כן' }])}`,
  }),

  anomaly: () => ({
    title: 'סיכום היום',
    html: `${bigQuestion('היה משהו חריג היום?')}
      ${choice('answerAnomaly', [{ v: 'no', ico: '👍', label: 'לא, הכול רגיל' }, { v: 'yes', ico: '❗', label: 'כן, היה משהו', cls: 'alarm' }])}`,
  }),

  anomalyText: (S) => ({
    title: 'מה היה חריג?',
    html: `${bigQuestion('ספר בקצרה מה קרה. אפשר ללחוץ על המיקרופון ולדבר.')}
      ${inputWithMic('summaryIn', 'למשל: המנוע התחמם בחזרה', true)}
      <p class="muted">זה יופיע לך כתזכורת בביקור הבא.</p>
      ${nextBtn('המשך', { data: { save: 'summary', required: '1' } })}`,
    fill: { summaryIn: S.visit.draft.summary },
  }),

  summary: (S) => ({
    title: 'סיכום היום',
    html: `${bigQuestion('רוצה להוסיף משפט על היום?')}
      ${inputWithMic('summaryIn', 'למשל: הפלגה נעימה, רוח טובה', true)}
      ${nextBtn('המשך', { data: { save: 'summary' } })}
      ${btn('flowNext', 'דלג', { cls: 'secondary small' })}`,
    fill: { summaryIn: S.visit.draft.summary },
  }),

  nextTime: (S) => ({
    title: 'לפעם הבאה',
    html: `${bigQuestion('צריך להביא משהו בפעם הבאה?')}
      ${inputWithMic('nextIn', 'למשל: פילטר שמן')}
      ${nextBtn('המשך', { data: { save: 'next' } })}
      ${btn('flowNext', 'לא צריך כלום', { cls: 'secondary small' })}`,
    fill: { nextIn: S.visit.draft.next },
  }),

  done: (S) => {
    const v = S.visit;
    const d = v.draft || {};
    const left = uncheckedCount(S, 'close');
    const rows = [
      d.hours != null ? `🛠 שעות מנוע: ${d.hours}` : null,
      v.fueled ? '⛽ תדלוק מלא' : null,
      v.anomaly === true ? `❗ חריג: ${esc(d.summary || '')}` : d.summary ? `📝 ${esc(d.summary)}` : null,
      d.next ? `🧳 להביא: ${esc(d.next)}` : null,
    ].filter(Boolean);
    return {
      title: 'סיום הביקור',
      html: `${rows.length ? card('', 'מה נרשם היום', rows.map((r) => `<p>${r}</p>`).join('')) : ''}
        ${left ? card('warn', `נשארו ${left} סעיפים לא מסומנים בסגירה`, '<p class="muted">אפשר לחזור אחורה ולסמן, או לסיים ככה.</p>') : ''}
        ${hasOpenItems(S) ? openItemsCard(S, 'נשאר פתוח לפעם הבאה') : ''}
        ${btn('flowFinish', 'סיום ביקור', { cls: 'ok', ico: '✓' })}`,
    };
  },
};

/** מסך לבדיקה אחת: פריט גדול באמצע וכפתור "בדקתי". אפשר לעבור לתצוגה של כל הרשימה */
function checkStep(S, pos, list, title) {
  if (S.visit.listView?.[list]) return checkListView(S, list, title);
  const text = S.lists[list][pos.i];
  return {
    title,
    html: `${progress(progressOf(S, pos))}
      <div class="step-item">${esc(text)}</div>
      ${btn('flowCheck', 'בדקתי ✓', { cls: 'ok', data: { list, key: pos.i } })}
      ${checkAllBtn(list)}
      ${btn('toggleListView', 'לראות את כל הבדיקות כרשימה', { cls: 'secondary small', ico: '☰', data: { list } })}`,
  };
}

/** כל הבדיקות במסך אחד, מסמנים בלחיצה וממשיכים */
function checkListView(S, list, title) {
  return {
    title,
    html: `${S.lists[list].map((t, i) => checkRow({ action: 'tick', data: { list, key: i }, text: t, done: S.visit[list][i] })).join('')}
      ${btn('flowListDone', 'המשך', { ico: '➜', data: { list } })}
      ${checkAllBtn(list)}
      ${btn('toggleListView', 'לחזור לבדיקה אחת בכל מסך', { cls: 'secondary small', ico: '↩', data: { list } })}`,
  };
}

/* ---------- המסך עצמו ---------- */

function flow(params) {
  const S = state();
  if (!S.visit) return null;
  const pos = params.key ? { key: params.key, i: Number(params.i) || 0 } : (S.visit.pos || firstStep(S));
  // זוכרים איפה עומדים, כדי להמשיך מכאן אם האפליקציה נסגרת
  if (JSON.stringify(S.visit.pos) !== JSON.stringify(pos)) { setPos(S, pos); save(); }
  const view = STEP_VIEWS[pos.key](S, pos);
  return {
    title: view.title,
    html: `<div class="step" data-key="${pos.key}">${view.html}</div>`,
    backHome: view.backHome,
    after: () => {
      for (const [id, v] of Object.entries(view.fill || {})) {
        const el = document.getElementById(id);
        if (el && v && !el.value) el.value = v;
      }
    },
  };
}

function goNext() {
  const S = state();
  const next = nextStep(S, S.visit.pos);
  if (!next) return;
  setPos(S, next);
  save();
  go('flow', next);
}

/* ---------- פעולות ---------- */

const actions = {
  startVisit() {
    const S = state();
    startVisit(S);
    clearAllDrafts(); // ביקור חדש מתחיל בלי טקסט מהביקור הקודם
    const first = firstStep(S);
    setPos(S, first);
    save();
    go('flow', first);
  },
  resumeVisit() {
    const S = state();
    go('flow', S.visit.pos || firstStep(S));
  },

  async flowNext(d) {
    const S = state();
    if (d.save === 'hours') {
      const h = num(val('hoursIn'));
      if (h == null) return toast('הקלד מספר, או לחץ "המנוע לא הונע היום"');
      if (isHoursDecrease(S, h) && !(await ask(`המספר ${h} קטן מהקודם (${S.hours}). זה נכון?`, { yes: 'כן, זה נכון', no: 'לא, אתקן' }))) return;
      setDraft(S, 'hours', h);
    }
    if (d.save === 'summary') {
      const t = val('summaryIn');
      if (d.required && !t) return toast('כתוב או הקלט מה היה חריג');
      setDraft(S, 'summary', t);
    }
    if (d.save === 'next') setDraft(S, 'next', val('nextIn'));
    goNext();
  },
  flowSkipHours() { setDraft(state(), 'hours', null); goNext(); },
  flowCheck(d) { setCheck(state(), d.list, Number(d.key), true); goNext(); },
  toggleListView(d) {
    toggleListView(state(), d.list);
    save(); render(); window.scrollTo(0, 0);
  },
  async flowListDone(d) {
    const S = state();
    const left = uncheckedCount(S, d.list);
    if (left && !(await ask(`נשארו ${left} בדיקות לא מסומנות. להמשיך בכל זאת?`, { yes: 'כן, להמשיך', no: 'לא, אסמן' }))) return;
    const next = stepAfter(S, S.visit.pos.key);
    if (!next) return;
    setPos(S, next); save();
    go('flow', next);
  },
  flowPrev() {
    const S = state();
    const prev = prevStep(S, S.visit.pos);
    if (!prev) return;
    setPos(S, prev); save();
    go('flow', prev);
  },
  flowCheckAll(d) {
    const S = state();
    checkAll(S, d.list);
    const next = stepAfter(S, S.visit.pos.key);
    if (!next) return;
    setPos(S, next); save();
    go('flow', next);
    toast('הכול סומן');
  },
  answerFuel(d) { setFueled(state(), d.v === 'yes'); goNext(); },
  answerAnomaly(d) { setAnomaly(state(), d.v === 'yes'); goNext(); },

  toggleDo(d) { toggleActivity(state(), d.k); save(); render(); },
  tick(d) {
    const S = state();
    setCheck(S, d.list, Number(d.key), !S.visit[d.list][d.key]);
    save(); render();
  },
  valveToggle() {
    const S = state();
    if (isValveClosed(S)) { openValve(S); toast('הברז מסומן כפתוח'); }
    else { closeValve(S); toast('נרשם: הברז סגור. אזכיר לך לפתוח'); }
    save(); render();
  },

  flowFinish() {
    const S = state();
    const d = S.visit.draft || {};
    finishVisit(S, { hours: d.hours ?? null, next: d.next || '', summary: d.summary || '' });
    save();
    clearAllDrafts();
    goHome();
    toast('הביקור נשמר. להתראות!');
  },
};

export default { screens: { flow }, actions };
