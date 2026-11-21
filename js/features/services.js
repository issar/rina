// טיפולים: רשימת סוגי טיפול, הגדרה ועריכה, וסימון טיפול שבוצע.
import { state, save } from '../core/store.js';
import { back } from '../core/router.js';
import { btn, navBtn, card, checkRow, esc, val, toast, ask } from '../core/ui.js';
import { num, lines } from '../core/util.js';
import { serviceInfo } from '../domain/engine.js';
import { getServiceType, saveServiceType, deleteServiceType, markServiceDone } from '../domain/services.js';

function services() {
  const S = state();
  const si = serviceInfo(S);
  return {
    title: 'טיפולים',
    html: `
      ${si ? card(si.level, `טיפול מנוע הבא: ${si.next} שעות`, `<p>${si.left > 0 ? `נשארו ${si.left} שעות` : 'הגיע הזמן'}</p>`) : ''}
      <h2>סוגי טיפול</h2>
      ${S.serviceTypes.length
        ? '<p class="muted">לוחצים על טיפול כדי לסמן שבוצע.</p>'
        : '<p class="muted">עוד לא הוגדרו טיפולים. מגדירים פעם אחת, ואחר כך רק מסמנים.</p>'}
      ${S.serviceTypes.map((t) => `<div class="row">
        ${navBtn('serviceDo', esc(t.name), { ico: '🛠', data: { id: t.id } })}
        ${navBtn('serviceEdit', '✏️', { cls: 'secondary', data: { id: t.id }, style: 'flex:0 0 90px' })}
      </div>`).join('')}
      ${navBtn('serviceEdit', 'סוג טיפול חדש', { cls: 'secondary', ico: '+' })}`,
  };
}

function serviceEdit(p) {
  const S = state();
  const t = getServiceType(S, p.id) || { name: '', includes: [], dangers: [], engine: false };
  return {
    title: p.id ? 'עריכת טיפול' : 'טיפול חדש',
    html: `
      <label class="field" for="stName">שם הטיפול</label>
      <input type="text" id="stName" value="${esc(t.name)}" placeholder="למשל: טיפול 100 שעות">
      <label class="field" for="stInc">מה הטיפול כולל (שורה לכל דבר)</label>
      <textarea id="stInc" placeholder="החלפת שמן&#10;החלפת פילטר שמן">${esc(t.includes.join('\n'))}</textarea>
      <label class="field" for="stDan">מה לבדוק אחרי הטיפול (יופיע בביקור הבא)</label>
      <textarea id="stDan" placeholder="ברז יניקת מי ים פתוח&#10;אין נזילת שמן">${esc(t.dangers.join('\n'))}</textarea>
      <div id="stEngineWrap">${checkRow({ action: 'flipEngine', text: `זה טיפול המנוע של כל ${S.settings.serviceEvery} שעות`, done: t.engine, flag: true })}</div>
      ${btn('saveService', 'שמור', { cls: 'ok', ico: '✓', data: { id: p.id } })}
      ${p.id ? btn('deleteService', 'מחק את סוג הטיפול', { cls: 'secondary small', data: { id: p.id } }) : ''}`,
  };
}

function serviceDo(p) {
  const S = state();
  const t = getServiceType(S, p.id);
  if (!t) return null;
  const list = (items) => items.map((x) => `<p>• ${esc(x)}</p>`).join('');
  return {
    title: t.name,
    html: `
      ${t.includes.length ? card('', 'הטיפול כולל', list(t.includes)) : ''}
      ${t.dangers.length ? card('warn', 'אחרי הטיפול לבדוק', list(t.dangers) + '<p class="muted">זה יופיע לך גם בביקור הבא.</p>') : ''}
      ${t.engine ? `<label class="field" for="sdHours">שעות מנוע בזמן הטיפול</label>
        <input type="number" inputmode="decimal" id="sdHours" value="${S.hours ?? ''}">` : ''}
      ${btn('doService', 'ביצעתי את הטיפול', { cls: 'ok', ico: '✓', data: { id: t.id } })}`,
  };
}

const actions = {
  flipEngine(d, el) {
    // מצב זמני בטופס, נשמר רק בלחיצה על "שמור"
    el.classList.toggle('done');
    el.querySelector('.box').textContent = el.classList.contains('done') ? '✓' : '';
  },
  saveService(d) {
    const name = val('stName');
    if (!name) return toast('צריך לתת שם לטיפול');
    saveServiceType(state(), {
      id: d.id, name,
      includes: lines(val('stInc')),
      dangers: lines(val('stDan')),
      engine: document.querySelector('#stEngineWrap .check').classList.contains('done'),
    });
    save(); back(); toast('הטיפול נשמר');
  },
  deleteService(d) {
    if (!ask('למחוק את סוג הטיפול?')) return;
    deleteServiceType(state(), d.id);
    save(); back();
  },
  doService(d) {
    const t = markServiceDone(state(), d.id, num(val('sdHours')));
    save(); back();
    toast(t && t.dangers.length ? 'נשמר. אזכיר לך מה לבדוק' : 'הטיפול נשמר');
  },
};

export default { screens: { services, serviceEdit, serviceDo }, actions };
