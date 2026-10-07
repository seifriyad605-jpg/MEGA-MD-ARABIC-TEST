import { translate } from '@vitalets/google-translate-api';

const cache = new Map();
const pending = new Map();
const MAX_CACHE = 2000;

function hasEnglish(text) {
  return typeof text === 'string' && /[A-Za-z]{2,}/.test(text);
}

const fixedTranslations = new Map([
  ['*Usage:*\\n.autoreact on/off', '*طريقة الاستخدام:*\\n.autoreact on/off'],
  ['*✅ Auto-react enabled*', '*✅ تم تمكين التفاعل التلقائي*'],
  ['*❌ Auto-react disabled*', '*❌ تم تعطيل التفاعل التلقائي*']
]);

function shouldTranslate(text) {
  if (!hasEnglish(text)) return false;
  if (/^https?:\/\//i.test(text.trim())) return false;
  return true;
}

async function translateText(text) {
  if (fixedTranslations.has(text.trim())) return fixedTranslations.get(text.trim());
  if (!shouldTranslate(text)) return text;
  // Keep the original MEGA-MD menu completely unchanged.
  if (/MEGA MENU|COMMAND INFO|COMMAND:|PREFIXES?:|PLUGINS?:|VERSION:|TIME:|Bot:|Command Info/i.test(text)) return text;
  const key = text.trim();
  if (cache.has(key)) return cache.get(key);
  if (pending.has(key)) return pending.get(key);

  const job = (async () => {
    try {
      const result = await translate(key, { from: 'en', to: 'ar' });
      const out = result?.text || text;
      if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value);
      cache.set(key, out);
      return out;
    } catch (e) {
      return text;
    } finally {
      pending.delete(key);
    }
  })();

  pending.set(key, job);
  return job;
}

async function localizeValue(value) {
  if (typeof value === 'string') return translateText(value);
  if (Array.isArray(value)) return Promise.all(value.map(localizeValue));
  if (!value || typeof value !== 'object') return value;

  const out = { ...value };
  for (const key of ['text', 'caption']) {
    if (typeof out[key] === 'string') out[key] = await translateText(out[key]);
  }

  // Translate common button/list text without touching IDs or URLs.
  if (Array.isArray(out.buttons)) {
    out.buttons = await Promise.all(out.buttons.map(async (button) => {
      if (!button || typeof button !== 'object') return button;
      const b = { ...button };
      if (b.buttonText?.displayText) {
        b.buttonText = { ...b.buttonText, displayText: await translateText(b.buttonText.displayText) };
      }
      return b;
    }));
  }

  if (out.sections && Array.isArray(out.sections)) {
    out.sections = await Promise.all(out.sections.map(async (section) => {
      const s = { ...section };
      if (s.title) s.title = await translateText(s.title);
      if (Array.isArray(s.rows)) {
        s.rows = await Promise.all(s.rows.map(async (row) => {
          const r = { ...row };
          if (r.title) r.title = await translateText(r.title);
          if (r.description) r.description = await translateText(r.description);
          return r;
        }));
      }
      return s;
    }));
  }

  return out;
}

export function installArabicLocalizer(sock) {
  if (!sock || sock.__arabicLocalizerInstalled) return sock;
  const original = sock.sendMessage.bind(sock);

  sock.sendMessage = async function (jid, content, options) {
    try {
      const localized = await localizeValue(content);
      return original(jid, localized, options);
    } catch {
      return original(jid, content, options);
    }
  };

  sock.__arabicLocalizerInstalled = true;
  return sock;
}
