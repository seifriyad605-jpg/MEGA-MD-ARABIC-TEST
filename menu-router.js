import config from './config.js';

const TOP = [
  { title: '🤖 الذكاء الاصطناعي', description: 'أدوات الذكاء الاصطناعي والمحادثة', id: 'menu:ai' },
  { title: '🎨 الصور والملصقات', description: 'إنشاء وتحويل الصور والملصقات', id: 'menu:media' },
  { title: '⬇️ التحميل والبحث', description: 'تحميل وبحث من الخدمات المتاحة', id: 'menu:download' },
  { title: '👥 أدوات الجروبات', description: 'إدارة وحماية الجروبات', id: 'menu:groups' },
  { title: '🛠️ الأدوات', description: 'أدوات وحلول متنوعة', id: 'menu:tools' },
  { title: '⚙️ المالك', description: 'إعدادات وإدارة البوت', id: 'menu:owner' }
];

const MENUS = {
  ai: [
    ['🤖 GPT', 'استخدام الذكاء الاصطناعي', 'cmd:ai-gpt'],
    ['🦙 Llama', 'محادثة Llama', 'cmd:ai-llama'],
    ['🧠 Mistral', 'محادثة Mistral', 'cmd:ai-mistral'],
    ['💬 Chatbot', 'تفعيل واستخدام الشات بوت', 'cmd:chatbot']
  ],
  media: [
    ['🧩 Emoji Mix', 'دمج إيموجيين في ملصق', 'cmd:emojimix'],
    ['🖼️ تحليل صورة', 'تحليل صورة بالذكاء الاصطناعي', 'cmd:analyze'],
    ['🎞️ GIF', 'أدوات GIF', 'cmd:gif'],
    ['🔤 ATTP', 'إنشاء ملصق نصي', 'cmd:attp'],
    ['🔙 رجوع', 'العودة للقائمة الرئيسية', 'menu:home']
  ],
  download: [
    ['📘 Facebook', 'تحميل من فيسبوك', 'cmd:facebook'],
    ['🔎 Fetch', 'جلب محتوى من رابط', 'cmd:fetch'],
    ['📏 Distance', 'حساب المسافة', 'cmd:distance'],
    ['🔙 رجوع', 'العودة للقائمة الرئيسية', 'menu:home']
  ],
  groups: [
    ['🔗 Anti-Link', 'حماية الجروب من الروابط', 'cmd:antilink'],
    ['🚫 Anti-Spam', 'حماية الجروب من السبام', 'cmd:antispam'],
    ['🤬 Anti-Badword', 'منع الكلمات الممنوعة', 'cmd:antibadword'],
    ['🏷️ Anti-Tag', 'حماية الجروب من المنشن الجماعي', 'cmd:antitag'],
    ['👋 الترحيب', 'إعداد رسائل الترحيب', 'cmd:welcome'],
    ['🔙 رجوع', 'العودة للقائمة الرئيسية', 'menu:home']
  ],
  tools: [
    ['🏓 Ping', 'فحص سرعة استجابة البوت', 'cmd:ping'],
    ['❤️ Auto React', 'التفاعل التلقائي مع الرسائل', 'cmd:autoreact'],
    ['👀 Auto Read', 'القراءة التلقائية', 'cmd:autoread'],
    ['⌨️ Auto Typing', 'الكتابة التلقائية', 'cmd:autotyping'],
    ['🎲 8Ball', 'لعبة الكرة السحرية', 'cmd:eightball'],
    ['🔙 رجوع', 'العودة للقائمة الرئيسية', 'menu:home']
  ],
  owner: [
    ['📡 Alive', 'فحص حالة البوت', 'cmd:alive'],
    ['🧹 Clear', 'تنظيف المحادثة', 'cmd:clear'],
    ['🗑️ Clear Chat', 'تنظيف الشات', 'cmd:clearchat'],
    ['💾 Clear Session', 'تنظيف بيانات الجلسة', 'cmd:clearsession'],
    ['🔙 رجوع', 'العودة للقائمة الرئيسية', 'menu:home']
  ]
};

async function sendList(sock, chatId, title, rows, quoted) {
  await sock.sendMessage(chatId, {
    text: title,
    footer: `🤖 ${config.botName || 'CRAZY-SEIF'}`,
    title: 'CRAZY-SEIF',
    buttonText: 'اختار الخدمة',
    sections: [{ title: 'الخدمات المتاحة', rows: rows.map(([rowTitle, description, id]) => ({
      title: rowTitle,
      description,
      rowId: id
    })) }]
  }, { quoted });
}

export async function sendMainMenu(sock, message) {
  const chatId = message.key.remoteJid;
  await sendList(
    sock,
    chatId,
    '🤖 *أهلاً بيك في CRAZY-SEIF*\\n\\nاختار الخدمة اللي محتاجها من القائمة تحت 👇',
    TOP.map(x => [x.title, x.description, x.id]),
    message
  );
}

export async function handleInteractiveSelection(sock, message) {
  const m = message?.message || {};
  const selected = m.listResponseMessage?.singleSelectReply?.selectedRowId
    || m.buttonsResponseMessage?.selectedButtonId
    || m.templateButtonReplyMessage?.selectedId;

  if (!selected) {
    const text = m.conversation || m.extendedTextMessage?.text || '';
    if (/^(menu|start|ابدأ|ابدا|القائمة|القائمه|مساعدة|مساعده|اهلا|أهلا|السلام عليكم)$/i.test(text.trim())) {
      await sendMainMenu(sock, message);
      return true;
    }
    return false;
  }

  if (selected === 'menu:home') {
    await sendMainMenu(sock, message);
    return true;
  }

  if (selected.startsWith('menu:')) {
    const key = selected.slice(5);
    const rows = MENUS[key];
    if (!rows) return false;
    const names = {
      ai: '🤖 *الذكاء الاصطناعي*',
      media: '🎨 *الصور والملصقات*',
      download: '⬇️ *التحميل والبحث*',
      groups: '👥 *أدوات الجروبات*',
      tools: '🛠️ *الأدوات*',
      owner: '⚙️ *أدوات المالك*'
    };
    await sendList(sock, message.key.remoteJid, names[key] || 'الخدمات', rows, message);
    return true;
  }

  if (selected.startsWith('cmd:')) {
    // Convert the selected menu item into a normal bot command.
    // Command names remain English exactly as requested.
    m.conversation = `${config.prefix || '.'}${selected.slice(4)}`;
    return false;
  }

  return false;
}
