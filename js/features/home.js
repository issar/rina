// מסך הבית: ברכה, רק מה שדחוף, וכפתור אחד גדול להתחלה.
// כל השאר (טיפולים, פרויקטים, היסטוריה, הגדרות) נמצא במסך "עוד".
import { state, save } from '../core/store.js';
import { render, clearAllDrafts } from '../core/router.js';
import { btn, navBtn, ask } from '../core/ui.js';
import { cancelVisit } from '../domain/visit.js';
import { resolveOpenItem } from '../domain/openItems.js';
import { openItemsCard, anomalyCard, engineCard, fuelCard } from './widgets.js';
import { serviceInfo } from '../domain/engine.js';
import { APP_VERSION } from '../version.js';

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'לילה טוב';
  if (h < 12) return 'בוקר טוב';
  if (h < 17) return 'צהריים טובים';
  return 'ערב טוב';
}

// תמונה אישית בראש מסך הבית בלבד. בשאר המסכים אין תמונה, כדי שהכפתורים והרשימות יישארו קריאים.
// מצב ברז יניקת מי הים מופיע על התמונה, כדי שיראו אותו מיד בלי לגלול
// סגור: פס אדום עם "פתחתי". פתוח: לא מציגים כלום, חוץ מרגע אחרי "פתחתי" (פס ירוק שנעלם לאט)
let justOpened = false;
function valveBadge(S) {
  const v = S.open.find((o) => o.valve);
  if (v) {
    return `<div class="hero-valve closed" role="alert"><span>⛔ ברז יניקת מי ים סגור!</span>
        ${btn('heroValveOpened', 'פתחתי', { cls: 'ok small', data: { id: v.id } })}</div>`;
  }
  if (!justOpened) return '';
  justOpened = false;
  return '<div class="hero-valve open fade-out"><span>✓ ברז יניקת מי ים פתוח</span></div>';
}

const hero = (S) => `<div class="hero">
    <img src="img/hero.jpg" alt="" aria-hidden="true">
    ${valveBadge(S)}
    <div class="hero-text" aria-hidden="true"><span class="hero-hello">${greeting()}, יוסי!</span><span class="hero-boat">⛵ יאכטה רינה</span></div>
  </div>`;

function home() {
  const S = state();
  if (S.visit) {
    return {
      title: 'RINA',
      brand: true,
      html: S.visit.pos?.key === 'sailing'
        ? `${hero(S)}<p class="step-q">אתה באמצע הפלגה.</p>
          ${btn('resumeVisit', 'חזרה להפלגה', { cls: 'ok', ico: '⛵' })}
          ${navBtn('more', 'עוד אפשרויות (טיפולים, היסטוריה...)', { cls: 'secondary small', ico: '☰' })}`
        : `${hero(S)}<p class="step-q">אתה באמצע ביקור בסירה.</p>
          ${btn('resumeVisit', 'ממשיכים מאיפה שעצרנו', { cls: 'ok', ico: '➜' })}
          ${navBtn('more', 'עוד אפשרויות', { cls: 'secondary small', ico: '☰' })}
          ${btn('cancelVisit', 'לבטל את הביקור ולהתחיל מחדש', { cls: 'secondary small' })}`,
    };
  }
  const si = serviceInfo(S);
  // במסך הבית מציגים רק מה שדורש תשומת לב
  const urgent = `${openItemsCard(S, undefined, { skipValve: true })}${anomalyCard(S)}${si && si.level !== 'good' ? engineCard(S) : ''}${fuelCard(S)}${si ? '' : engineCard(S)}`;
  return {
    title: 'RINA',
    brand: true, // כותרת ממורכזת עם סירה בכל צד
    html: `${hero(S)}<p class="step-q">מה עושים היום?</p>
      ${btn('startVisit', 'הגעתי לסירה', { ico: '⛵' })}
      ${navBtn('bring', `מתכונן בבית: מה להביא${S.bring.length ? ` (${S.bring.length})` : ''}`, { cls: 'secondary', ico: '🧳' })}
      ${urgent}
      ${navBtn('more', 'עוד אפשרויות', { cls: 'secondary small', ico: '☰' })}`,
  };
}

function more() {
  return {
    title: 'עוד אפשרויות',
    html: `${navBtn('services', 'טיפולים', { cls: 'secondary', ico: '🛠' })}
      ${navBtn('projects', 'פרויקטים', { cls: 'secondary', ico: '📋' })}
      ${navBtn('history', 'היסטוריה', { cls: 'secondary', ico: '📖' })}
      ${navBtn('cloud', 'סנכרון בין מכשירים', { cls: 'secondary', ico: '☁️' })}
      ${navBtn('settings', 'הגדרות וגיבוי', { cls: 'secondary', ico: '⚙️' })}
      <p class="muted center">גרסה ${APP_VERSION}</p>`,
  };
}

const actions = {
  heroValveOpened(d) {
    resolveOpenItem(state(), d.id);
    justOpened = true;
    save(); render();
  },
  async cancelVisit() {
    if (!(await ask('לבטל את הביקור? מה שסומן בו לא יישמר.', { yes: 'כן, לבטל', no: 'לא, להמשיך בביקור', danger: true }))) return;
    cancelVisit(state());
    clearAllDrafts();
    save(); render();
  },
};

export default { screens: { home, more }, actions };
