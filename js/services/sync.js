// סנכרון בין הטלפון לענן. הטלפון תמיד עובד קודם (גם בלי רשת), והענן מתעדכן כשיש רשת.
// בנוי כ-factory כדי שאפשר לבדוק אותו בבדיקות עם ענן מזויף.
//
// איך זה עובד:
// - כל שמירה בטלפון מסמנת "יש שינויים" ושולחת לענן אחרי כמה שניות.
// - בפתיחה, בחזרה לאפליקציה וכשהרשת חוזרת: אם אין שינויים מקומיים, מורידים מהענן גרסה חדשה יותר.
// - כל שמירה בענן נבדקת מול מספר הגרסה (rev). אם מכשיר אחר שמר בינתיים, זו התנגשות:
//   שומרים את גרסת הענן בהיסטוריה, מאחדים יומנים, והמכשיר הנוכחי קובע.
import { isEmptyState, resolveConflict, firstSyncPlan } from '../domain/sync.js';

export function createSync({ cloud, store, meta, ask = async () => true, onRemote = () => {}, onStatus = () => {}, delayMs = 4000, timer = setTimeout, clearTimer = clearTimeout }) {
  let m = { baseRev: 0, dirty: false, lastSync: null, uid: '', seq: 0, error: '', ...meta.read() };
  let busy = null;
  let pending = null;

  const persist = () => meta.write(m);
  const setStatus = (patch) => { Object.assign(m, patch); persist(); onStatus(status()); };

  function status() {
    return { configured: cloud.configured(), signedIn: cloud.signedIn(), email: cloud.userEmail(), dirty: m.dirty, lastSync: m.lastSync, error: m.error };
  }

  /** נקרא בכל שמירה מקומית */
  function onLocalSave() {
    m.dirty = true; m.seq += 1; persist();
    if (!ready()) return;
    if (pending) clearTimer(pending);
    pending = timer(() => { pending = null; syncNow(); }, delayMs);
  }

  const ready = () => cloud.configured() && cloud.signedIn();

  async function push(opts) {
    const seq = m.seq;
    const local = store.state();
    let res = await cloud.pushRemote(local, m.baseRev, device(), opts);
    if (!res.ok) {
      // מכשיר אחר שמר בינתיים. גרסת הענן נשמרת בהיסטוריה, ואז מאחדים
      await cloud.archiveRemote(res.data, 'conflict', device());
      store.replaceAll(resolveConflict(local, res.data), { silent: true });
      onRemote();
      res = await cloud.pushRemote(store.state(), res.rev, device(), opts);
      if (!res.ok) throw new Error('conflict twice');
    }
    m.baseRev = res.rev;
    if (m.seq === seq) m.dirty = false; // אם נשמר משהו בזמן השליחה, הוא יישלח בפעם הבאה
  }

  async function pull() {
    const row = await cloud.fetchRemote();
    if (!row) { if (!isEmptyState(store.state())) await push(); return; }
    if (row.rev !== m.baseRev) {
      store.replaceAll(row.data, { silent: true });
      m.baseRev = row.rev;
      onRemote();
    }
  }

  /** התחברות ראשונה במכשיר הזה: מחליטים מה עולה ומה יורד */
  async function firstSync() {
    const row = await cloud.fetchRemote();
    const plan = firstSyncPlan(store.state(), row);
    if (plan === 'upload') { m.baseRev = row ? row.rev : 0; await push(); }
    else if (plan === 'download') { store.replaceAll(row.data, { silent: true }); m.baseRev = row.rev; m.dirty = false; onRemote(); }
    else {
      const takeCloud = await ask('יש נתונים גם בטלפון הזה וגם בענן. מה להשאיר?', { yes: 'את הנתונים מהענן', no: 'את מה שבטלפון הזה' });
      if (takeCloud) {
        await cloud.archiveRemote(store.state(), 'device-replaced', device());
        store.replaceAll(row.data, { silent: true }); m.baseRev = row.rev; m.dirty = false; onRemote();
      } else {
        m.baseRev = row.rev; await push(); // גרסת הענן הקודמת נשמרת בהיסטוריה
        await cloud.archiveRemote(row.data, 'device-replaced', device());
      }
    }
    m.uid = cloud.userId();
  }

  /** סנכרון עכשיו. לא זורק שגיאות: בלי רשת פשוט מנסים שוב בפעם הבאה. */
  function syncNow(opts) {
    if (!ready()) return Promise.resolve(status());
    if (busy) return busy;
    busy = (async () => {
      try {
        if (m.uid !== cloud.userId()) await firstSync();
        else if (m.dirty) await push(opts);
        else await pull();
        setStatus({ lastSync: Date.now(), error: '' });
      } catch (e) {
        setStatus({ error: e && e.name === 'AuthError' ? 'auth' : 'offline' });
      } finally { busy = null; }
      return status();
    })();
    return busy;
  }

  /** לפני איפוס או שחזור: שומרים בענן עותק של מה שיש עכשיו */
  async function archiveCurrent(reason) {
    if (!ready()) return;
    try { await cloud.archiveRemote(store.state(), reason, device()); } catch {}
  }

  function signedOut() { m = { ...m, baseRev: 0, uid: '', error: '' }; persist(); onStatus(status()); }

  let dev = meta.device || 'device';
  const device = () => dev;

  return { onLocalSave, syncNow, status, archiveCurrent, signedOut };
}
