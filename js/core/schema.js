// מבנה הנתונים וגרסאות שלו.
// הוספת שדה חדש עם ברירת מחדל: מספיק להוסיף אותו כאן. migrate() ממלא אותו בנתונים ישנים.
// שינוי שדה קיים (שינוי שם, מבנה או משמעות): מעלים את SCHEMA_VERSION ומוסיפים פונקציה ל-MIGRATIONS,
// כדי שנתונים שכבר שמורים בטלפון יעברו לגרסה החדשה בלי לאבד כלום.

export const SCHEMA_VERSION = 1;

export function defaultState() {
  return {
    v: SCHEMA_VERSION,
    hours: null,            // שעות מנוע אחרונות שהוזנו
    lastServiceHours: null, // שעות המנוע בטיפול המנוע האחרון
    fuelFillHours: null,    // שעות המנוע בתדלוק המלא האחרון
    open: [],               // פריטים פתוחים {id, text, valve, created}
    bring: [],              // מה להביא {id, text, source?, pid?, created}
    serviceTypes: [],       // {id, name, includes[], dangers[], engine}
    pendingDangers: null,   // {name, date, items: [{text, ok}]}
    lastAnomaly: null,      // חריג שדווח בסוף הביקור הקודם {text, date}
    projects: [],           // {id, name, done, created, notes: [{ts, text}]}
    log: [],                // {id, ts, kind, text, vid?} vid = מזהה הביקור שבו נרשם
    feedback: [],           // הערות לשיפור ובאגים מאבא {id, ts, text}. עולות לענן עם שאר הנתונים
    logDeleted: [],         // מזהים של רישומים שנמחקו, כדי שסנכרון לא יחזיר אותם ממכשיר אחר
    visit: null,            // {id, started, work, sail, pre{}, post{}, close{}, fueled}
    lists: {
      pre: ['ברז יניקת מי ים פתוח', 'שמן מנוע', 'נוזל קירור', 'רצועות מנוע', "בילג'"],
      post: ['מים יוצאים מהאגזוז', 'אין נורות אזהרה'],
      close: [
        { g: 'מנוע וחשמל', t: 'מנוע כבוי, המפתח הוצא' },
        { g: 'מנוע וחשמל', t: 'לוח בקרה כבוי' },
        { g: 'מנוע וחשמל', t: "בילג' יבש" },
        { g: 'מנוע וחשמל', t: 'גז סגור' },
        { g: 'מנוע וחשמל', t: 'מכשירי חשמל כבויים' },
        { g: 'מנוע וחשמל', t: 'חשמל כללי כבוי' },
        { g: 'מנוע וחשמל', t: 'חיבור מתח חוף' },
        { g: 'סיפון', t: 'מפרשים מקופלים ומכוסים' },
        { g: 'סיפון', t: "כיסוי ווינצ'ים וגלגלות" },
        { g: 'סיפון', t: 'כיסוי הגה' },
        { g: 'סיפון', t: 'עוגן מהודק עד הסוף' },
        { g: 'סיפון', t: 'חבלי עגינה ופנדרים' },
        { g: 'סגירה', t: 'חלונות ופתחים סגורים' },
        { g: 'סגירה', t: 'אשפה הוצאה' },
        { g: 'סגירה', t: 'נעילה' },
      ],
    },
    settings: { serviceEvery: 100, fuelSoft: 75, fuelHard: 110 },
  };
}

// מפתח: הגרסה שאליה עוברים. ערך: פונקציה שמקבלת את הנתונים מהגרסה הקודמת ומחזירה חדשים.
// דוגמה לעתיד:  2: (s) => ({ ...s, tanks: [] }),
export const MIGRATIONS = {};

export function migrate(raw) {
  let s = raw;
  const from = Number(s.v) || 1;
  if (from > SCHEMA_VERSION) throw new Error('הנתונים שמורים בגרסה חדשה יותר מהאפליקציה');
  for (let v = from + 1; v <= SCHEMA_VERSION; v++) {
    if (!MIGRATIONS[v]) throw new Error(`חסרה המרה לגרסה ${v}`);
    s = MIGRATIONS[v](s);
    s.v = v;
  }
  // שדות שנוספו לברירת המחדל ולא קיימים בנתונים הישנים
  const d = defaultState();
  return { ...d, ...s, lists: { ...d.lists, ...s.lists }, settings: { ...d.settings, ...s.settings } };
}
