// הערות לשיפור ודיווח על באגים. נשמרות בנתונים, ועולות לענן עם הסנכרון, כך שאיסר יכול לקרוא אותן.
import { uid } from '../core/util.js';

export function addFeedback(S, text, now = Date.now()) {
  const t = String(text ?? '').trim();
  if (!t) return null;
  const item = { id: uid(), ts: now, text: t };
  S.feedback = [item, ...(S.feedback || [])];
  return item;
}
