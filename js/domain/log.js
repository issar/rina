// יומן ההיסטוריה. כל פעולה משמעותית נרשמת כאן.
import { uid } from '../core/util.js';

export const LOG_ICONS = { visit: '⛵', fix: '🔧', service: '🛠', open: '⚠️', resolve: '✓', project: '📋', fuel: '⛽', summary: '📝', anomaly: '❗' };

export function addLog(S, kind, text, now = Date.now()) {
  S.log.unshift({ id: uid(), ts: now, kind, text });
}
