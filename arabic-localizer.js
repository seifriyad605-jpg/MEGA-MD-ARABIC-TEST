import { translate } from '@vitalets/google-translate-api';

const cache = new Map();
const pending = new Map();
const MAX_CACHE = 2000;

function isOriginalMenu(text) {
  return typeof text === 'string' && /MEGA MENU/.test(text) &&
    /(?:Bot|Prefix(?:es)?|Plugins?|Version|Time):/i.test(text) &&
    /[.!/#]\w+/.test(text);
}

function hasEnglish(text) {
  return typeof text === 'string' && /[A-Za-z]{2,}/.test(text);
}

const fixedTranslations = new Map([
  ['*Usage:*\n.autoreact on/off', '*طريقة الاستخدام:*\n.autoreact on/off'],
  ['*✅ Auto-react enabled*', '*✅ تم تمكين التفاعل التلقائي*'],
  ['*❌ Auto-react disabled*', '*❌ تم تعطيل التفاعل التلقائي*']
]);

function shouldTranslate(text) {
  if (!hasEnglish(text)) return false;
  const value = text.trim();
  if (!value || /^https?:\/\//i.test(value)) return false;
  if (isOriginalMenu(value)) return false;
  return true;
}

function protectTokens(text) {
  const tokens = [];
  const patterns = [
    /https?:\/\/\S+/gi,
    /@[0-9A-Za-z._-]+/g,
    /\.[a-z][a-z0-9_-]*(?:\s+(?:on|off|add|del|list|enable|disable))?/gi,
    /\b(?:CRAZY-SEIF|Seif Riyad)\b/g,
    /\b\d{6,}\b/g
  ];
  let out = text;
  for (const re of patterns) {
    out = out.replace(re, (match) => {
      const token = '__MEGA_KEEP_' + tokens.length + '__';
      tokens.push(match);
      return token;
    });
  }
  return { out, tokens };
}

function restoreTokens(text, tokens) {
  return text.replace(/__MEGA_KEEP_(\d+)__/g, (_, i) => tokens[Number(i)] ?? _);
}

async function translateText(text) {
  const trimmed = text.trim();
  if (fixedTranslations.has(trimmed)) return fixedTranslations.get(trimmed);
  if (!shouldTranslate(text)) return text;

  const { out: protectedText, tokens } = protectTokens(text);
  const key = protectedText.trim();

  if (cache.has(key)) return restoreTokens(cache.get(key), tokens);
  if (pending.has(key)) return restoreTokens(await pending.get(key), tokens);

  const job = (async () => {
    try {
      const result = await translate(key, { from: 'en', to: 'ar' });
      const translated = result?.text || key;
      if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value);
      cache.set(key, translated);
      return translated;
    } catch {
      return key;
    } finally {
      pending.delete(key);
    }
  })();

  pending.set(key, job);
  return restoreTokens(await job, tokens);
}

async function localizeValue(value) {
  if (typeof value === 'string') return translateText(value);
  if (Array.isArray(value)) return Promise.all(value.map(localizeValue));
  if (!value || typeof value !== 'object') return value;

  const out = { ...value };
  for (const key of ['text', 'caption']) {
    if (typeof out[key] === 'string') out[key] = await translateText(out[key]);
  }

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

  if (Array.isArray(out.sections)) {
    out.sections = await Promise.all(out.sections.map(async (section) => {
      const s = { ...section };
      if (typeof s.title === 'string') s.title = await translateText(s.title);
      if (Array.isArray(s.rows)) {
        s.rows = await Promise.all(s.rows.map(async (row) => {
          const r = { ...row };
          if (typeof r.title === 'string') r.title = await translateText(r.title);
          if (typeof r.description === 'string') r.description = await translateText(r.description);
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
      return original(jid, await localizeValue(content), options);
    } catch {
      return original(jid, content, options);
    }
  };
  sock.__arabicLocalizerInstalled = true;
  return sock;
}