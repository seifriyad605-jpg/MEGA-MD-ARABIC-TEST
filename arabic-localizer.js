import { translate } from '@vitalets/google-translate-api';

const cache = new Map();
const pending = new Map();
const MAX_CACHE = 3000;

const commonEnglishFragments = [
  [/\bSuccess:\b/gi, 'تم بنجاح:'],
  [/\bError:\b/gi, 'خطأ:'],
  [/\bUsage:\b/gi, 'طريقة الاستخدام:'],
  [/\bAccess Denied:\b/gi, 'تم رفض الوصول:'],
  [/\bAction Denied:\b/gi, 'تم رفض العملية:'],
  [/\bPlease provide\b/gi, 'من فضلك اكتب'],
  [/\bPlease mention a user, reply to a message, or provide a number\b/gi, 'من فضلك اعمل منشن لعضو أو قم بالرد على رسالة أو اكتب رقم'],
  [/\bNo sudo users found\\.?/gi, 'لا يوجد مستخدمون بصلاحيات سودو.'],
  [/\bhas been granted Sudo privileges\\.?/gi, 'تم منحه صلاحيات سودو.'],
  [/\bSudo privileges revoked from\b/gi, 'تم سحب صلاحيات سودو من'],
  [/\bFailed to add sudo\\.?/gi, 'فشل في إضافة صلاحيات سودو.'],
  [/\bFailed to remove sudo\\.?/gi, 'فشل في إزالة صلاحيات سودو.'],
  [/\bCannot remove the Main Owner\\.?/gi, 'لا يمكن إزالة المالك الأساسي.'],
  [/\bOnly the Main Owner can manage Sudo privileges\\.?/gi, 'المالك الأساسي فقط يمكنه إدارة صلاحيات سودو.'],
  [/\bWelcome messages\s+\*?enabled\*?\s+with simple message\.\s+Use\b/gi, 'تم تشغيل رسائل الترحيب بالرسالة الافتراضية. استخدم'],
  [/\bWelcome messages disabled for this group\\.?/gi, 'تم إيقاف رسائل الترحيب في هذا الجروب.'],
  [/\bCustom welcome message set successfully\\.?/gi, 'تم تعيين رسالة الترحيب المخصصة بنجاح.'],
  [/\bWelcome messages are already enabled\\.?/gi, 'رسائل الترحيب مفعلة بالفعل.'],
  [/\bWelcome messages are already disabled\\.?/gi, 'رسائل الترحيب متوقفة بالفعل.'],
  [/\bSUDO MANAGER\b/gi, 'إدارة سودو'],
  [/\bSUDO USERS\b/gi, 'مستخدمو سودو'],
  [/\bAvailable Variables:\b/gi, 'المتغيرات المتاحة:'],
  [/\bEnable welcome messages\b/gi, 'تشغيل رسائل الترحيب'],
  [/\bDisable welcome messages\b/gi, 'إيقاف رسائل الترحيب'],
  [/\bSet a custom welcome message\b/gi, 'تعيين رسالة ترحيب مخصصة'],
  [/\bEnable\b/gi, 'تشغيل'],
  [/\bDisable\b/gi, 'إيقاف']
];

function replaceCommonEnglishFragments(text) {
  if (typeof text !== 'string') return text;
  let out = text;
  for (const [pattern, replacement] of commonEnglishFragments) {
    out = out.replace(pattern, replacement);
  }
  return out;
}


function isOriginalMenu(text) {
  return typeof text === 'string' && /MEGA MENU/.test(text) &&
    /(?:Bot|Prefix(?:es)?|Plugins?|Version|Time):/i.test(text) &&
    /[.!/#]\w+/.test(text);
}

function hasEnglish(text) {
  return typeof text === 'string' && /[A-Za-z]{2,}/.test(text);
}

const fixedTranslations = new Map([

  [
    'ℹ️ *Sorry, only group admins can use this command.*',
    'ℹ️ *عفواً، الأمر ده متاح لمشرفي الجروب بس.*'
  ],

  [
    '╭━━━〔 *SUDO MANAGER* 〕━━━┈\\n┃\\n┃ 📝 *Usage:*\\n┃ ▢ .sudo add <@tag/reply/num>\\n┃ ▢ .sudo del <@tag/reply/num>\\n┃ ▢ .sudo list\\n┃\\n╰━━━━━━━━━━━━━━━━━━┈',
    '╭━━━〔 *إدارة سودو* 〕━━━┈\\n┃\\n┃ 📝 *طريقة الاستخدام:*\\n┃ ▢ .sudo add <@tag/reply/num>\\n┃ ▢ .sudo del <@tag/reply/num>\\n┃ ▢ .sudo list\\n┃\\n╰━━━━━━━━━━━━━━━━━━┈'
  ],
  [
    'Welcome messages *enabled* with simple message. Use *.welcome set [your message]* to customize.',
    'تم تشغيل رسائل الترحيب بالرسالة الافتراضية. استخدم *.welcome set [your message]* لتخصيصها.'
  ]
,
  ['*Usage:*\n.autoreact on/off', '*طريقة الاستخدام:*\n.autoreact on/off'],
  ['*✅ Auto-react enabled*', '*✅ تم تمكين التفاعل التلقائي*'],
  ['*❌ Auto-react disabled*', '*❌ تم تعطيل التفاعل التلقائي*'],

  [
    '📥 *Welcome Message Setup*\n\n✅ *.welcome on* — Enable welcome messages\n🛠️ *.welcome set Your custom message* — Set a custom welcome message\n🚫 *.welcome off* — Disable welcome messages\n\n*Available Variables:*\n• {user} - Mentions the new member\n• {group} - Shows group name\n• {description} - Shows group description',
    '📥 *شرح رسائل الترحيب*\n\n✅ *.welcome on* — تشغيل رسائل الترحيب\n🛠️ *.welcome set [الرسالة]* — تعيين رسالة ترحيب مخصصة\n🚫 *.welcome off* — إيقاف رسائل الترحيب\n\n*المتغيرات المتاحة:*\n• {user} - منشن العضو الجديد\n• {group} - اسم الجروب\n• {description} - وصف الجروب'
  ],
  [
    '❌ Invalid command. Use:\n*.welcome on* - Enable\n*.welcome set [message]* - Set custom message\n*.welcome off* - Disable',
    '❌ الأمر غير صحيح. استخدم:\n*.welcome on* - تشغيل\n*.welcome set [message]* - تعيين رسالة مخصصة\n*.welcome off* - إيقاف'
  ],
  [
    '⚠️ Please provide a custom welcome message. Example: *.welcome set Welcome to the group!*',
    '⚠️ اكتب رسالة الترحيب التي تريدها. مثال: *.welcome set أهلا وسهلا بالجروب!*'
  ],
  [
    '📤 *Goodbye Message Setup*\n\n✅ *.goodbye on* — Enable goodbye messages\n🛠️ *.goodbye set Your custom goodbye message* — Set a custom goodbye message\n🚫 *.goodbye off* — Disable goodbye messages\n\n*Available Variables:*\n• {user} - Mentions the leaving member\n• {group} - Shows group name',
    '📤 *شرح رسائل المغادرة*\n\n✅ *.goodbye on* — تشغيل رسائل المغادرة\n🛠️ *.goodbye set [الرسالة]* — تعيين رسالة مغادرة مخصصة\n🚫 *.goodbye off* — إيقاف رسائل المغادرة\n\n*المتغيرات المتاحة:*\n• {user} - منشن العضو الذي غادر\n• {group} - اسم الجروب'
  ],
  [
    '❌ Invalid command. Use:\n*.goodbye on* - Enable\n*.goodbye set [message]* - Set custom goodbye message\n*.goodbye off* - Disable',
    '❌ الأمر غير صحيح. استخدم:\n*.goodbye on* - تشغيل\n*.goodbye set [message]* - تعيين رسالة مخصصة\n*.goodbye off* - إيقاف'
  ]
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
    /\{[A-Za-z][A-Za-z0-9_-]*\}/g,
    /\[[^\]\n]{1,80}\]/g,
    /\*?\.[a-z][a-z0-9_-]*(?:\s+(?:on|off|set|add|del|list|enable|disable|status|help))?(?:\s+\[[^\]\n]{1,80}\])?\*?/gi,
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

async function translateLine(line) {
  if (!line.trim() || !hasEnglish(line)) return line;

  const { out: protectedText, tokens } = protectTokens(line);
  const key = protectedText.trim();
  if (!key) return line;

  if (cache.has(key)) return restoreTokens(cache.get(key), tokens);
  if (pending.has(key)) return restoreTokens(await pending.get(key), tokens);

  const job = (async () => {
    try {
      const result = await translate(key, { from: 'en', to: 'ar' });
      const translated = replaceCommonEnglishFragments(result?.text || key);
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

async function translateText(text) {
  const trimmed = text.trim();
  if (fixedTranslations.has(trimmed)) return replaceCommonEnglishFragments(fixedTranslations.get(trimmed));
  if (!shouldTranslate(text)) return text;

  // Translate each line independently so help/usage messages keep their layout.
  const lines = text.split('\n');
  const translated = await Promise.all(lines.map(translateLine));
  return translated.join('\n');
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
