// פעולות שמופעלות מכפתורים: <button data-a="שם" data-x="..."> קורא ל-actions.שם(dataset, element)

const actions = {};

export function registerActions(map) {
  for (const [name, fn] of Object.entries(map)) {
    if (actions[name]) throw new Error(`פעולה כפולה: ${name}`);
    actions[name] = fn;
  }
}

export function initActions(root = document) {
  root.addEventListener('click', (e) => {
    const el = e.target.closest('[data-a]');
    if (!el) return;
    const fn = actions[el.dataset.a];
    if (!fn) return console.warn('פעולה לא מוכרת:', el.dataset.a);
    fn(el.dataset, el);
  });
}
