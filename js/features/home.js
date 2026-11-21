// מסך הבית.
import { state } from '../core/store.js';
import { btn, navBtn } from '../core/ui.js';
import { openItemsCard, anomalyCard, dangersCard, engineCard, fuelCard } from './widgets.js';

function home() {
  const S = state();
  return {
    title: 'רינה ⛵',
    html: `
      ${openItemsCard(S)}
      ${anomalyCard(S)}
      ${dangersCard(S)}
      ${engineCard(S)}
      ${fuelCard(S)}
      ${S.visit
        ? navBtn('today', 'המשך ביקור בסירה', { cls: 'ok', ico: '⛵' })
        : btn('arrive', 'הגעתי לסירה', { ico: '⛵' })}
      ${navBtn('bring', `מה להביא לסירה${S.bring.length ? ` (${S.bring.length})` : ''}`, { cls: 'secondary', ico: '🧳' })}
      <div class="row">
        ${navBtn('services', 'טיפולים', { cls: 'secondary', ico: '🛠' })}
        ${navBtn('projects', 'פרויקטים', { cls: 'secondary', ico: '📋' })}
      </div>
      <div class="row">
        ${navBtn('history', 'היסטוריה', { cls: 'secondary', ico: '📖' })}
        ${navBtn('settings', 'הגדרות', { cls: 'secondary', ico: '⚙️' })}
      </div>`,
  };
}

export default { screens: { home }, actions: {} };
