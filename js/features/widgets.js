// כרטיסים שמופיעים בכמה מסכים: פריטים פתוחים, בדיקות אחרי טיפול, מצב מנוע ודלק.
import { esc, btn, navBtn, card, checkRow } from '../core/ui.js';
import { fmtDate } from '../core/util.js';
import { serviceInfo, fuelInfo } from '../domain/engine.js';
import { happenedThisVisit } from '../domain/visit.js';

export function openItemsCard(S, title = 'שים לב! נשארו דברים פתוחים') {
  if (!S.open.length) return '';
  const rows = S.open.map((o) => `<div class="item">
      <span class="txt">${esc(o.text)}<br><span class="muted">מ${fmtDate(o.created)}</span></span>
      ${btn('resolveOpen', o.valve ? 'פתחתי' : 'טופל', { cls: 'ok', data: { id: o.id } })}
    </div>`).join('');
  return card('alert', `⚠️ ${title}`, rows);
}

export function dangersCard(S) {
  const d = S.pendingDangers;
  if (!d) return '';
  const when = happenedThisVisit(S, d.date) ? 'היום בוצע' : 'בפעם הקודמת';
  const rows = d.items.map((it, i) => checkRow({ action: 'dangerTick', data: { i }, text: it.text, done: it.ok })).join('');
  return card('warn', `🔧 ${when}: ${esc(d.name)}`, `<p class="muted">${fmtDate(d.date)}. לבדוק לפני שמתחילים:</p>${rows}`);
}

export function anomalyCard(S) {
  const a = S.lastAnomaly;
  if (!a) return '';
  return card('warn', '❗ בפעם הקודמת דיווחת על משהו חריג',
    `<p><strong>${esc(a.text)}</strong></p><p class="muted">${fmtDate(a.date)}</p>
     ${btn('dismissAnomaly', 'טופל / בדקתי', { cls: 'ok small' })}`);
}

export function engineCard(S) {
  const si = serviceInfo(S);
  if (!si) {
    return card('', '🛠 טיפול מנוע', `<p>עוד לא הוזנו שעות מנוע.</p>${navBtn('settings', 'להזנת שעות מנוע', { cls: 'secondary small' })}`);
  }
  const txt = si.left <= 0
    ? `עבר הזמן לטיפול ${si.next} (באיחור של ${Math.abs(si.left)} שעות)`
    : `עוד <span class="big-num">${si.left}</span> שעות לטיפול ${si.next}`;
  return card(si.level, '🛠 טיפול מנוע', `<p>${txt}</p><p class="muted">שעות מנוע עכשיו: ${S.hours}</p>`);
}

export function fuelCard(S) {
  const fi = fuelInfo(S);
  if (!fi || fi.level === 'good') return '';
  const msg = fi.level === 'alert' ? 'צריך לתדלק!' : 'כדאי לתדלק בקרוב.';
  return card(fi.level, '⛽ דלק', `<p>עברו ${fi.since} שעות מנוע מאז התדלוק. ${msg}</p>`);
}
