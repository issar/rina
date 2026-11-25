// נקודת הכניסה: טוען נתונים, רושם את כל החלקים (features) ומציג את מסך הבית.
// כדי להוסיף חלק חדש: יוצרים קובץ ב-features/ ומוסיפים אותו לרשימה FEATURES.
import { load, setErrorHandler } from './core/store.js';
import { registerScreens, initRouter, render, currentScreen } from './core/router.js';
import { startSync } from './services/syncInstance.js';
import { registerActions, initActions } from './core/actions.js';
import { $, toast } from './core/ui.js';

import common from './features/common.js';
import home from './features/home.js';
import flow from './features/flow.js';
import input from './features/input.js';
import bring from './features/bring.js';
import services from './features/services.js';
import projects from './features/projects.js';
import historyFeature from './features/history.js';
import settings from './features/settings.js';
import cloud from './features/cloud.js';

const FEATURES = [common, home, flow, input, bring, services, projects, historyFeature, settings, cloud];

setErrorHandler(toast);
load();
for (const f of FEATURES) {
  registerScreens(f.screens);
  registerActions(f.actions);
}
initRouter({ app: $('#app'), title: $('#title'), back: $('#backBtn') });
initActions();
render();
startSync({
  onRemote: () => render(),                                       // הגיעו נתונים ממכשיר אחר
  onStatus: () => { if (currentScreen() === 'cloud') render(); }, // עדכון מצב השמירה במסך הסנכרון
});

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
