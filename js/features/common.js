// פעולות כלליות: ניווט, חזרה, מיקרופון, וטיפול בפריטים פתוחים ובבדיקות אחרי טיפול
// (אלה מופיעים בכמה מסכים, ולכן הפעולות שלהם כאן).
import { go, back, render } from '../core/router.js';
import { state, save } from '../core/store.js';
import { toast } from '../core/ui.js';
import { resolveOpenItem } from '../domain/openItems.js';
import { toggleDangerCheck, checkAllDangers } from '../domain/services.js';
import { dismissAnomaly } from '../domain/visit.js';
import { startDictation } from '../services/speech.js';

export default {
  screens: {},
  actions: {
    go(d) { go(d.to, { id: d.id, mode: d.mode, pid: d.pid }); },
    back() { back(); },
    mic(d, el) { startDictation(document.getElementById(d.for), el); },

    resolveOpen(d) {
      const item = resolveOpenItem(state(), d.id);
      save(); render();
      if (item) toast(item.valve ? 'הברז מסומן כפתוח' : 'סומן כטופל');
    },
    dismissAnomaly() {
      dismissAnomaly(state());
      save(); render();
      toast('סומן כטופל');
    },
    dangerTick(d) {
      const allDone = toggleDangerCheck(state(), Number(d.i));
      save(); render();
      if (allDone) toast('מצוין, כל הבדיקות אחרי הטיפול בוצעו');
    },
    dangerCheckAll() {
      checkAllDangers(state());
      save(); render();
      toast('כל הבדיקות אחרי הטיפול סומנו');
    },
  },
};
