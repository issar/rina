// עזרים כלליים וטהורים. בלי DOM, כדי שאפשר יהיה להשתמש בהם גם בבדיקות.

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export const num = (v) => {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

export const round1 = (n) => Math.round(n * 10) / 10;

export const lines = (text) => String(text ?? '').split('\n').map((s) => s.trim()).filter(Boolean);

export const fmtDate = (ts) =>
  new Date(ts).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'numeric', year: '2-digit' });

export const fmtTime = (ts) =>
  new Date(ts).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
