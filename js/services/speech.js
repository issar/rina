// הקלטה לטקסט בעזרת זיהוי הדיבור המובנה של הטלפון (עברית).
import { toast } from '../core/ui.js';

let rec = null;

export const isSpeechSupported = () => !!(window.SpeechRecognition || window.webkitSpeechRecognition);

export function startDictation(field, button) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return toast('זיהוי דיבור לא זמין כאן. אפשר להקליד.');
  if (rec) { rec.stop(); return; }
  if (!field) return;
  const base = field.value ? field.value + ' ' : '';
  rec = new SR();
  rec.lang = 'he-IL';
  rec.interimResults = true;
  rec.continuous = false;
  button.classList.add('on');
  rec.onresult = (ev) => {
    let txt = '';
    for (const r of ev.results) txt += r[0].transcript;
    field.value = base + txt;
  };
  rec.onerror = (ev) => {
    const msg = {
      network: 'אין חיבור לזיהוי דיבור. אפשר להקליד.',
      'not-allowed': 'צריך לאשר גישה למיקרופון',
    }[ev.error] || 'לא הצלחתי לשמוע. נסה שוב.';
    toast(msg);
  };
  rec.onend = () => { button.classList.remove('on'); rec = null; };
  rec.start();
}
