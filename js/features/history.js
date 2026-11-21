// היסטוריה.
import { state } from '../core/store.js';
import { esc } from '../core/ui.js';
import { fmtDate, fmtTime } from '../core/util.js';
import { LOG_ICONS } from '../domain/log.js';

function history() {
  const S = state();
  return {
    title: 'היסטוריה',
    html: S.log.length
      ? S.log.map((l) => `<div class="log-entry"><div class="when">${fmtDate(l.ts)}, ${fmtTime(l.ts)}</div>${LOG_ICONS[l.kind] || '•'} ${esc(l.text)}</div>`).join('')
      : '<p class="muted">עוד אין היסטוריה. כל מה שתסמן יירשם כאן.</p>',
  };
}

export default { screens: { history }, actions: {} };
