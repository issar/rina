// יומן ההיסטוריה. כל פעולה משמעותית נרשמת כאן.
// רישום בזמן ביקור מקבל את מזהה הביקור (vid), וכך ההיסטוריה מקובצת לפי ביקורים.
import { uid } from '../core/util.js';

export const LOG_ICONS = { visit: '⛵', fix: '🔧', service: '🛠', open: '⚠️', resolve: '✓', project: '📋', fuel: '⛽', summary: '📝', anomaly: '❗' };

export function addLog(S, kind, text, now = Date.now()) {
  const e = { id: uid(), ts: now, kind, text };
  const vid = S.visit?.id;
  if (vid) e.vid = vid;
  S.log.unshift(e);
}
