// קיבוץ ההיסטוריה לפי ימים, עם תמצית קצרה לכל יום. טהור, בלי DOM.

/** מפתח יום לפי השעון המקומי (YYYY-MM-DD) */
export function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** ימים מהחדש לישן. בתוך כל יום, האירועים לפי סדר השעות. */
export function groupByDay(log = []) {
  const days = new Map();
  for (const e of log) {
    const k = dayKey(e.ts);
    if (!days.has(k)) days.set(k, { key: k, ts: e.ts, entries: [] });
    days.get(k).entries.push(e);
  }
  return [...days.values()]
    .map((d) => ({ ...d, entries: d.entries.sort((a, b) => a.ts - b.ts), summary: daySummary(d.entries) }))
    .sort((a, b) => b.key.localeCompare(a.key));
}

/**
 * קיבוץ לפי ביקורים (סשנים), מהחדש לישן.
 * רישום עם vid שייך לביקור שלו. רישום בלי vid (מחוץ לביקור, או מלפני שהיו מזהים) מקובץ לפי יום.
 */
export function groupSessions(log = []) {
  const groups = new Map();
  for (const e of log) {
    const key = e.vid ? `v:${e.vid}` : `d:${dayKey(e.ts)}`;
    if (!groups.has(key)) groups.set(key, { key, visit: !!e.vid, entries: [] });
    groups.get(key).entries.push(e);
  }
  return [...groups.values()]
    .map((g) => {
      const entries = g.entries.sort((a, b) => a.ts - b.ts);
      return { ...g, entries, ts: entries[0].ts, end: entries[entries.length - 1].ts, summary: daySummary(entries) };
    })
    .sort((a, b) => b.end - a.end);
}

/** מחיקת ביקור שלם מההיסטוריה (למשל ביקור ניסיון). לא משנה שעות מנוע, טיפולים וכו'. */
export function deleteSession(S, key) {
  const ids = new Set(groupSessions(S.log).find((g) => g.key === key)?.entries.map((e) => e.id) || []);
  if (!ids.size) return 0;
  S.log = S.log.filter((e) => !ids.has(e.id));
  S.logDeleted = [...(S.logDeleted || []), ...ids];
  return ids.size;
}

const count = (n, one, many) => (n === 1 ? one : `${n} ${many}`);

/**
 * תמצית של יום בכמה מילים, מהחשוב לפחות חשוב.
 * מחזירה רשימת פריטים קצרים (המסך מציג אותם בשורה אחת).
 */
export function daySummary(entries) {
  const of = (kind) => entries.filter((e) => e.kind === kind);
  const parts = [];

  const anomalies = of('anomaly');
  if (anomalies.length) parts.push('❗ חריג');

  const visits = of('visit').map((e) => e.text);
  if (visits.some((t) => t.includes('הפלגה'))) parts.push('⛵ הפלגה');
  const services = of('service');
  const fixes = of('fix');
  // "עבודה" רק אם אין טיפול או תיקון שכבר אומרים את זה
  if (visits.some((t) => t.includes('עבודה')) && !services.length && !fixes.length) parts.push('🔧 עבודה');
  if (visits.length && visits.every((t) => t.includes('בוטל'))) parts.push('ביקור בוטל');

  if (services.length) parts.push(`🛠 ${services.length === 1 ? services[0].text.replace(/\s*\(.*\)$/, '') : `${services.length} טיפולים`}`);

  if (fixes.length) parts.push(`🔧 ${count(fixes.length, 'תיקון', 'תיקונים')}`);

  const opens = of('open');
  if (opens.some((e) => e.text.includes('ברז'))) parts.push('⚠️ ברז נסגר');
  else if (opens.length) parts.push('⚠️ נשאר פתוח');

  if (of('fuel').length) parts.push('⛽ תדלוק');
  if (of('project').length) parts.push('📋 פרויקט');

  // אם היה רק סיכום רגיל או סגירת פריטים
  if (!parts.length) {
    const summary = of('summary')[0];
    parts.push(summary ? `📝 ${summary.text}` : `${entries.length} רישומים`);
  }
  return parts.slice(0, 3); // שורה אחת קצרה. הפירוט המלא בפתיחה

}
