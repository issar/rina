// מופע הסנכרון של האפליקציה, מחובר לענן האמיתי ולאחסון של הטלפון.
import * as cloud from './cloud.js';
import * as store from '../core/store.js';
import { createSync } from './sync.js';
import { ask } from '../core/ui.js';
import { uid } from '../core/util.js';

const META = 'rina-sync';
const DEV = 'rina-device';

function deviceName() {
  try {
    let d = localStorage.getItem(DEV);
    if (!d) {
      const ua = navigator.userAgent;
      const kind = /Android/i.test(ua) ? 'android' : /iPhone|iPad/i.test(ua) ? 'ios' : 'pc';
      d = `${kind}-${uid().slice(-6)}`;
      localStorage.setItem(DEV, d);
    }
    return d;
  } catch { return 'device'; }
}

const meta = {
  device: deviceName(),
  read() { try { return JSON.parse(localStorage.getItem(META)) || {}; } catch { return {}; } },
  write(m) { try { localStorage.setItem(META, JSON.stringify(m)); } catch {} },
};

let hooks = { onRemote: () => {}, onStatus: () => {} };

export const sync = createSync({
  cloud, store, meta, ask,
  onRemote: () => hooks.onRemote(),
  onStatus: (s) => hooks.onStatus(s),
});

/** מחברים את הסנכרון לאפליקציה: כל שמירה, חזרה לאפליקציה וחזרת רשת */
export function startSync({ onRemote, onStatus }) {
  hooks = { onRemote, onStatus };
  store.setSaveListener(() => sync.onLocalSave());
  window.addEventListener('online', () => sync.syncNow());
  document.addEventListener('visibilitychange', () => {
    // ביציאה מהאפליקציה שולחים מיד, כדי שלא יישאר רק בטלפון
    sync.syncNow(document.visibilityState === 'hidden' ? { keepalive: true } : undefined);
  });
  sync.syncNow();
}
