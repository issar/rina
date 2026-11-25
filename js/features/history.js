// היסטוריה מקובצת לפי ימים. כל יום הוא שורה עם תאריך ותמצית קצרה, ולחיצה פותחת את כל מה שקרה בו.
import { state } from '../core/store.js';
import { esc } from '../core/ui.js';
import { fmtDate, fmtTime } from '../core/util.js';
import { LOG_ICONS } from '../domain/log.js';
import { groupByDay } from '../domain/history.js';

function dayBlock(day) {
  const items = day.entries
    .map((l) => `<div class="log-entry"><span class="when">${fmtTime(l.ts)}</span> ${LOG_ICONS[l.kind] || '•'} ${esc(l.text)}</div>`)
    .join('');
  return `<details class="day">
    <summary>
      <span class="day-date">${esc(fmtDate(day.ts))}</span>
      <span class="day-sum">${esc(day.summary.join(' · '))}</span>
    </summary>
    <div class="day-body">${items}</div>
  </details>`;
}

function history() {
  const S = state();
  return {
    title: 'היסטוריה',
    html: S.log.length
      ? `<p class="muted">לוחצים על יום כדי לראות מה היה בו.</p>${groupByDay(S.log).map(dayBlock).join('')}`
      : '<p class="muted">עוד אין היסטוריה. כל מה שתסמן יירשם כאן.</p>',
  };
}

export default { screens: { history }, actions: {} };
