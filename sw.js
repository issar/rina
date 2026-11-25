// שומר את קבצי האפליקציה בטלפון כדי שתעבוד בלי רשת.
// קודם מנסה רשת (כדי לקבל עדכונים), ואם אין רשת משתמש בעותק השמור.
// כל קובץ שנטען פעם אחת נשמר אוטומטית, ולכן אין צורך לעדכן כאן רשימה כשמוסיפים קבצים.
const CACHE = 'rina-cache';
const CORE = ['./', './index.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  // no-cache: בודקים מול השרת בכל פעם (GitHub שומר קבצים בזיכרון הדפדפן 10 דקות),
  // כדי שתיקון שפורסם יגיע לטלפון מיד ולא יתערבבו קבצים ישנים וחדשים
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
