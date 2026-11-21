// הגדרות: שעות מנוע, ספי דלק, עריכת רשימות, גיבוי ושחזור.
import { state, save, replaceAll, exportJson, resetAll } from '../core/store.js';
import { goHome } from '../core/router.js';
import { btn, esc, val, toast, ask } from '../core/ui.js';
import { num } from '../core/util.js';
import { closeListToText, setLists } from '../domain/lists.js';
import { setHours } from '../domain/engine.js';

const numField = (id, label, value) =>
  `<label class="field" for="${id}">${label}</label><input type="number" inputmode="decimal" id="${id}" value="${value ?? ''}">`;

function settings() {
  const S = state();
  return {
    title: 'הגדרות',
    html: `
      <h2>מנוע ודלק</h2>
      ${numField('setHours', 'שעות מנוע עכשיו', S.hours)}
      ${numField('setLastSvc', 'בכמה שעות נעשה טיפול המנוע האחרון', S.lastServiceHours)}
      ${numField('setFuel', 'בכמה שעות היה התדלוק המלא האחרון', S.fuelFillHours)}
      <div class="row">
        <div>${numField('setSoft', 'תזכורת דלק אחרי', S.settings.fuelSoft)}</div>
        <div>${numField('setHard', 'אזהרת דלק אחרי', S.settings.fuelHard)}</div>
      </div>
      <h2>רשימות</h2>
      <p class="muted">שורה לכל סעיף. ברשימת הסגירה, שורה שמתחילה ב-# היא כותרת של אזור.</p>
      <label class="field" for="setPre">לפני התנעה</label>
      <textarea id="setPre">${esc(S.lists.pre.join('\n'))}</textarea>
      <label class="field" for="setPost">אחרי התנעה</label>
      <textarea id="setPost">${esc(S.lists.post.join('\n'))}</textarea>
      <label class="field" for="setClose">סיום ועזיבה</label>
      <textarea id="setClose" style="min-height:300px">${esc(closeListToText(S.lists.close))}</textarea>
      ${btn('saveSettings', 'שמור הגדרות', { cls: 'ok', ico: '✓' })}
      <h2>גיבוי</h2>
      <p class="muted">הנתונים נשמרים רק בטלפון הזה. כדאי לשמור גיבוי מדי פעם.</p>
      ${btn('exportData', 'שמור קובץ גיבוי', { cls: 'secondary', ico: '💾' })}
      ${btn('importData', 'שחזר מקובץ גיבוי', { cls: 'secondary', ico: '📂' })}
      <input type="file" id="importFile" accept="application/json" hidden>
      <h2>להתחיל מאפס</h2>
      <p class="muted">מוחק את כל מה שהוזן: היסטוריה, טיפולים, פרויקטים ושעות. אי אפשר לבטל.</p>
      ${btn('resetAll', 'למחוק הכול ולהתחיל מחדש', { cls: 'danger small', ico: '🗑' })}`,
  };
}

const actions = {
  saveSettings() {
    const S = state();
    S.lastServiceHours = num(val('setLastSvc'));
    const h = num(val('setHours'));
    if (h != null) setHours(S, h);
    S.fuelFillHours = num(val('setFuel'));
    S.settings.fuelSoft = num(val('setSoft')) ?? 75;
    S.settings.fuelHard = num(val('setHard')) ?? 110;
    setLists(S, { pre: val('setPre'), post: val('setPost'), close: val('setClose') });
    save(); toast('נשמר');
  },
  async resetAll() {
    if (!(await ask('למחוק את כל הנתונים ולהתחיל מאפס? אי אפשר לבטל את זה.', { yes: 'כן, למחוק הכול', danger: true }))) return;
    resetAll();
    goHome(); toast('הכול נמחק. מתחילים מחדש');
  },
  exportData() {
    const blob = new Blob([exportJson()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `rina-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  },
  importData() {
    const inp = document.getElementById('importFile');
    inp.onchange = async () => {
      const file = inp.files[0];
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        if (!data || typeof data.v !== 'number') throw new Error('bad');
        if (!(await ask('השחזור יחליף את כל הנתונים הנוכחיים. להמשיך?', { yes: 'כן, לשחזר', danger: true }))) return;
        replaceAll(data);
        goHome(); toast('הנתונים שוחזרו');
      } catch (e) { toast('הקובץ לא תקין'); }
    };
    inp.click();
  },
};

export default { screens: { settings }, actions };
