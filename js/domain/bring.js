// רשימת "מה להביא לסירה". מתמלאת מסיום ביקור, מפרויקטים ומהוספה ידנית.
import { uid } from '../core/util.js';

export function addBring(S, text, { source, pid } = {}, now = Date.now()) {
  S.bring.push({ id: uid(), text, ...(source ? { source } : {}), ...(pid ? { pid } : {}), created: now });
}

export function removeBring(S, id) {
  S.bring = S.bring.filter((b) => b.id !== id);
}

export const bringForProject = (S, pid) => S.bring.filter((b) => b.pid === pid);
