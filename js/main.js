// נקודת הכניסה: טוען נתונים, רושם את כל החלקים (features) ומציג את מסך הבית.
// כדי להוסיף חלק חדש: יוצרים קובץ ב-features/ ומוסיפים אותו לרשימה FEATURES.
import { load, setErrorHandler } from './core/store.js';
import { registerScreens, initRouter, render } from './core/router.js';
import { registerActions, initActions } from './core/actions.js';
import { $, toast } from './core/ui.js';

import common from './features/common.js';
import home from './features/home.js';
import visit from './features/visit.js';
import input from './features/input.js';
import bring from './features/bring.js';
import services from './features/services.js';
import projects from './features/projects.js';
import historyFeature from './features/history.js';
import settings from './features/settings.js';

const FEATURES = [common, home, visit, input, bring, services, projects, historyFeature, settings];

setErrorHandler(toast);
load();
for (const f of FEATURES) {
  registerScreens(f.screens);
  registerActions(f.actions);
}
initRouter({ app: $('#app'), title: $('#title'), back: $('#backBtn') });
initActions();
render();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
