// רכיבי תצוגה משותפים. כל טקסט שמגיע מהמשתמש עובר esc().

export const $ = (sel) => document.querySelector(sel);

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const val = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };

/** כפתור גדול. data: אובייקט שהופך ל-data-* */
export function btn(action, label, { cls = '', ico = '', data = {}, style = '' } = {}) {
  const attrs = Object.entries(data)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ');
  return `<button class="btn ${cls}" data-a="${action}" ${attrs} ${style ? `style="${style}"` : ''}>${ico ? `<span class="ico">${ico}</span>` : ''}${label}</button>`;
}

/** כפתור ניווט למסך */
export const navBtn = (to, label, opts = {}) => btn('go', label, { ...opts, data: { to, ...(opts.data || {}) } });

/** שורת סימון גדולה */
export function checkRow({ action, data = {}, text, done, sub = '', flag = false }) {
  const attrs = Object.entries(data).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ');
  return `<button class="check ${flag ? 'flag' : ''} ${done ? 'done' : ''}" data-a="${action}" ${attrs}>
    <span class="box">${done ? '✓' : ''}</span><span class="label">${esc(text)}${sub ? `<br><span class="muted">${esc(sub)}</span>` : ''}</span></button>`;
}

export const card = (cls, title, body) => `<div class="card ${cls}">${title ? `<h3>${title}</h3>` : ''}${body}</div>`;

/** שדה טקסט עם כפתור מיקרופון */
export function inputWithMic(id, placeholder, multiline = false) {
  const field = multiline
    ? `<textarea id="${id}" placeholder="${esc(placeholder)}"></textarea>`
    : `<input type="text" id="${id}" placeholder="${esc(placeholder)}">`;
  return `<div class="input-row">${field}<button class="mic" data-a="mic" data-for="${id}" aria-label="הקלטה">🎤</button></div>`;
}

export function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 2600);
}

/**
 * חלון אישור בתוך האפליקציה, עם כפתורים גדולים. מחזיר Promise<boolean>.
 * לא משתמשים ב-window.confirm, כי יש סביבות (כמו דף מוטמע) שחוסמות אותו בשקט.
 */
export function ask(msg, { yes = 'כן', no = 'ביטול', danger = false } = {}) {
  return new Promise((resolve) => {
    const prev = document.getElementById('dialog');
    if (prev) prev.remove();
    const wrap = document.createElement('div');
    wrap.id = 'dialog';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.innerHTML = `<div class="dialog-box">
        <p class="dialog-msg">${esc(msg)}</p>
        <button class="btn ${danger ? 'danger' : 'ok'}" data-r="1">${esc(yes)}</button>
        <button class="btn secondary" data-r="0">${esc(no)}</button>
      </div>`;
    const done = (r) => { wrap.remove(); resolve(r); };
    wrap.addEventListener('click', (e) => {
      e.stopPropagation(); // לא להפעיל פעולות של המסך שמתחת
      const b = e.target.closest('[data-r]');
      if (b) done(b.dataset.r === '1');
      else if (e.target === wrap) done(false);
    });
    document.body.appendChild(wrap);
    wrap.querySelector('[data-r="1"]').focus();
  });
}
