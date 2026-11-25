// חיבור ל-Supabase דרך fetch בלבד (בלי ספרייה חיצונית, כדי שהאפליקציה תיטען גם בלי רשת).
// התחברות: מייל וסיסמה, פעם אחת בכל מכשיר. ההתחברות נשמרת בטלפון ומתחדשת לבד.
import { SUPABASE_URL, SUPABASE_KEY } from './cloudConfig.js';

const AUTH_KEY = 'rina-auth';

export class AuthError extends Error {
  constructor(msg) { super(msg); this.name = 'AuthError'; }
}

export const configured = () => !!(SUPABASE_URL && SUPABASE_KEY);

let session = readSession();

function readSession() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY)) || null; } catch { return null; }
}
function writeSession(s) {
  session = s;
  try { s ? localStorage.setItem(AUTH_KEY, JSON.stringify(s)) : localStorage.removeItem(AUTH_KEY); } catch {}
}

export const signedIn = () => !!session?.refresh_token;
export const userEmail = () => session?.email || '';
export const userId = () => session?.uid || '';

function fromAuthResponse(j) {
  return {
    access_token: j.access_token,
    refresh_token: j.refresh_token,
    expires_at: j.expires_at || Math.floor(Date.now() / 1000) + (j.expires_in || 3600),
    email: j.user?.email || session?.email || '',
    uid: j.user?.id || session?.uid || '',
  };
}

async function authPost(path, body) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, j };
}

export async function signIn(email, password) {
  const r = await authPost('token?grant_type=password', { email, password });
  if (!r.ok) throw new AuthError(r.status === 400 ? 'המייל או הסיסמה לא נכונים' : 'ההתחברות נכשלה');
  writeSession(fromAuthResponse(r.j));
}

export function signOut() {
  const tok = session?.access_token;
  writeSession(null);
  if (tok) fetch(`${SUPABASE_URL}/auth/v1/logout`, { method: 'POST', headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${tok}` } }).catch(() => {});
}

async function accessToken() {
  if (!session) throw new AuthError('לא מחובר');
  if (session.expires_at - 60 > Date.now() / 1000) return session.access_token;
  const r = await authPost('token?grant_type=refresh_token', { refresh_token: session.refresh_token });
  if (!r.ok) {
    if (r.status >= 400 && r.status < 500) { writeSession(null); throw new AuthError('צריך להתחבר מחדש'); }
    throw new Error('refresh failed');
  }
  writeSession(fromAuthResponse(r.j));
  return session.access_token;
}

async function rest(path, { method = 'GET', body, keepalive = false } = {}) {
  const tok = await accessToken();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    keepalive,
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 401) { writeSession(null); throw new AuthError('צריך להתחבר מחדש'); }
  if (!res.ok) throw new Error(`cloud ${res.status}`);
  const txt = await res.text();
  return txt ? JSON.parse(txt) : null;
}

/** השורה של המשתמש בענן: {data, rev} או null אם עוד אין */
export async function fetchRemote() {
  const rows = await rest('boat_state?select=data,rev');
  return rows && rows[0] ? rows[0] : null;
}

/** שמירה בענן. מצליחה רק אם בענן עדיין הגרסה baseRev. אחרת מחזירה את מה שיש בענן. */
export async function pushRemote(data, baseRev, device, { keepalive = false } = {}) {
  const body = { p_data: data, p_base_rev: baseRev, p_device: device };
  const small = JSON.stringify(body).length < 60000; // לדפדפן יש מגבלה על בקשה שנשלחת בזמן סגירה
  return rest('rpc/push_state', { method: 'POST', body, keepalive: keepalive && small });
}

/** שמירת עותק בטבלת ההיסטוריה בענן (לפני איפוס, שחזור או התנגשות) */
export async function archiveRemote(data, reason, device) {
  await rest('rpc/archive_state', { method: 'POST', body: { p_data: data, p_reason: reason, p_device: device } });
}
