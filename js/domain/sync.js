// כללי סנכרון טהורים (בלי רשת ובלי DOM), כדי שאפשר לבדוק אותם.
// העיקרון: שום דבר לא נמחק בשקט. במקרה של התנגשות נשמרים הנתונים של המכשיר שבו עובדים עכשיו,
// היומן מאוחד משני הצדדים, והגרסה השנייה נשמרת בענן בטבלת ההיסטוריה.

/** האם אין בנתונים שום דבר שאבא הזין (טלפון חדש או אחרי איפוס) */
export function isEmptyState(S) {
  if (!S) return true;
  return S.hours == null && !S.log?.length && !S.projects?.length && !S.serviceTypes?.length
    && !S.bring?.length && !S.open?.length && !S.visit;
}

/** איחוד יומנים לפי מזהה, מהחדש לישן */
export function mergeLogs(a = [], b = []) {
  const byId = new Map();
  for (const e of [...a, ...b]) if (e && !byId.has(e.id)) byId.set(e.id, e);
  return [...byId.values()].sort((x, y) => y.ts - x.ts);
}

/** התנגשות: שני מכשירים שינו בלי לראות זה את זה. המכשיר הנוכחי קובע, והיומן מאוחד. */
export function resolveConflict(local, remote) {
  const out = JSON.parse(JSON.stringify(local));
  out.log = mergeLogs(local.log, remote?.log);
  return out;
}

/**
 * מה לעשות בהתחברות ראשונה במכשיר, לפי מה שיש בטלפון ומה שיש בענן.
 * 'upload' – בענן אין כלום, מעלים. 'download' – בטלפון אין כלום, מורידים. 'ask' – יש בשניהם, שואלים.
 */
export function firstSyncPlan(local, remoteRow) {
  if (!remoteRow) return 'upload';
  if (isEmptyState(local)) return 'download';
  if (isEmptyState(remoteRow.data)) return 'upload';
  return 'ask';
}
