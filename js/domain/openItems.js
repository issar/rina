// דברים שנשארו במצב חריג (ברז סגור, חלק מפורק) עד שמסמנים שטופלו.
// זה הלב הבטיחותי של האפליקציה: כל עוד יש פריט פתוח, ההפלגה חסומה.
import { uid } from '../core/util.js';
import { addLog } from './log.js';

export const VALVE_TEXT = 'ברז יניקת מי ים סגור';

export const isValveClosed = (S) => S.open.some((o) => o.valve);
export const hasOpenItems = (S) => S.open.length > 0;

export function addOpenItem(S, text, now = Date.now()) {
  S.open.push({ id: uid(), text, valve: false, created: now });
  addLog(S, 'open', `נשאר פתוח: ${text}`, now);
}

export function closeValve(S, now = Date.now()) {
  if (isValveClosed(S)) return;
  S.open.push({ id: uid(), text: VALVE_TEXT, valve: true, created: now });
  addLog(S, 'open', 'סגרתי את ברז יניקת מי הים', now);
}

export function openValve(S, now = Date.now()) {
  if (!isValveClosed(S)) return;
  S.open = S.open.filter((o) => !o.valve);
  addLog(S, 'resolve', 'פתחתי את ברז יניקת מי הים', now);
}

export function resolveOpenItem(S, id, now = Date.now()) {
  const item = S.open.find((o) => o.id === id);
  if (!item) return null;
  S.open = S.open.filter((o) => o.id !== id);
  addLog(S, 'resolve', item.valve ? 'פתחתי את ברז יניקת מי הים' : `טופל: ${item.text}`, now);
  return item;
}
