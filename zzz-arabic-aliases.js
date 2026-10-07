import commandHandler from '../lib/commandHandler.js';

const arabicNames = {
  menu: 'قائمة', ping: 'بنج', alive: 'الحالة', owner: 'المالك', help: 'مساعدة',
  gpt: 'ذكاء', ai: 'ذكاء', sticker: 'ستيكر', stickers: 'ستيكرات', toimg: 'صورة',
  tts: 'نطق', translate: 'ترجمة', weather: 'الطقس', news: 'أخبار', quote: 'اقتباس',
  joke: 'نكتة', meme: 'ميم', truth: 'حقيقة', dare: 'تحدي', tag: 'منشن', tagall: 'منشنالكل',
  promote: 'ترقية', demote: 'خفض', kick: 'طرد', add: 'إضافة', mute: 'كتم', unmute: 'إلغاءالكتم',
  warn: 'تحذير', warnings: 'التحذيرات', ban: 'حظر', unban: 'إلغاءالحظر',
  groupinfo: 'معلوماتالمجموعة', setgname: 'اسمالمجموعة', setgdesc: 'وصفالمجموعة',
  setgpp: 'صورةالمجموعة', antilink: 'منعالروابط', antibadword: 'منعالكلمات',
  qrcode: 'باركود', readqr: 'قراءةالباركود', base64: 'تشفير64', calc: 'حاسبة',
  math: 'رياضيات', wiki: 'ويكي', define: 'تعريف', screenshot: 'لقطةشاشة',
  ss: 'لقطةشاشة', speedtest: 'سرعةالنت', echo: 'كرر', script: 'السكريبت',
  gitclone: 'استنساخ', reload: 'إعادةتحميل', restart: 'إعادةتشغيل', update: 'تحديث',
  pair: 'ربط', play: 'تشغيل', song: 'أغنية', video: 'فيديو', gif: 'صورمتحركة',
  attp: 'ملصقنصي', take: 'تغييرالملصق', simage: 'تحويلصورة', s2img: 'تحويلصورة',
  url: 'رابط', tinyurl: 'تصغيرالرابط', fetch: 'جلب', tourl: 'تحويللرابط',
  getpp: 'صورةالحساب', setpp: 'تغييرصورةالحساب', setbio: 'النبذة', status: 'الحالة',
  quran: 'قرآن', units: 'وحدات', quote2: 'اقتباس2', joke2: 'نكتة2', flirt: 'مغازلة',
  ship: 'توافق', rank: 'ترتيب', whois: 'منهو', imdb: 'معلوماتفيلم', movie: 'فيلم',
  anime: 'أنمي', animes: 'أنمي', github: 'جيتهاب', gimage: 'صورجوجل', trends: 'الترند',
  string: 'نصوص', resize: 'تغييرالحجم', cipher: 'تشفير', dna: 'ديإنإيه',
  rle: 'ضغطالملفات', clear: 'مسح', notes: 'ملاحظات', poll: 'تصويت', stats: 'إحصائيات',
  sudo: 'مشرف', staff: 'المشرفين', settings: 'الإعدادات', mode: 'الوضع',
  autotyping: 'الكتابةالتلقائية', autostatus: 'الحالةالتلقائية', mention: 'المنشن',
  antidelete: 'منعالحذف', antispam: 'منعالسبام', autoreply: 'الردالتلقائي',
  uptime: 'وقتالتشغيل', getfile: 'جلبملف', getplugin: 'جلبإضافة', delplugin: 'حذفإضافة',
  installplugin: 'تثبيتإضافة', pull: 'سحبالتحديثات', rentbot: 'تأجيربوت',
  listrent: 'قائمةالبوتات', stoprent: 'إيقافالبوت', botclone: 'نسخالبوت',
  exad: 'إعلانات', hack: 'اختراق', simp: 'سيمب', wasted: 'مهدور',
  flip: 'عملة', dado: 'نرد', momo: 'ميمو', pies: 'فطائر', teddy: 'دبدوب',
  why: 'لماذا', wyr: 'ماذا تفضل', fact: 'معلومة', areact: 'تفاعل تلقائي',
  quoted: 'رسالة مقتبسة', vnote: 'رسالةصوتية', source: 'المصدر', mega: 'ميجا',
  fetch: 'جلب', gcadd: 'إضافةللمجموعة', clear: 'مسح', readqr: 'قراءةالباركود'
};

const categoryNames = {
  general: 'عام',
  admin: 'إدارة',
  owner: 'المالك',
  tools: 'أدوات',
  utility: 'أدوات',
  utilities: 'أدوات',
  media: 'وسائط',
  stickers: 'ملصقات',
  fun: 'ترفيه',
  games: 'ألعاب',
  ai: 'ذكاء اصطناعي',
  quotes: 'اقتباسات',
  group: 'المجموعة',
  privacy: 'الخصوصية',
  downloads: 'تحميل',
  misc: 'متنوع'
};

function transliterate(word) {
  const w = String(word).toLowerCase();
  const special = [
    ['tion','شن'], ['sion','جن'], ['sh','ش'], ['ch','تش'], ['th','ث'],
    ['kh','خ'], ['gh','غ'], ['ph','ف'], ['oo','و'], ['ee','ي'],
    ['ou','و'], ['qu','ك'], ['ck','ك']
  ];
  let s = w;
  for (const [a,b] of special) s = s.replaceAll(a,b);
  const map = {
    a:'ا', b:'ب', c:'ك', d:'د', e:'ي', f:'ف', g:'ج', h:'ه', i:'ي',
    j:'ج', k:'ك', l:'ل', m:'م', n:'ن', o:'و', p:'ب', q:'ق', r:'ر',
    s:'س', t:'ت', u:'و', v:'ف', w:'و', x:'كس', y:'ي', z:'ز',
    '0':'٠','1':'١','2':'٢','3':'٣','4':'٤','5':'٥','6':'٦','7':'٧','8':'٨','9':'٩'
  };
  return [...s].map(ch => map[ch] || ch).join('');
}

function attachAliases() {
  for (const [command, target] of commandHandler.commands) {
    const arabic = arabicNames[command] || transliterate(command);
    target.arabicName = arabic;
    target.arabicCategory = categoryNames[target.category] || target.category || 'متنوع';

    if (!commandHandler.aliases.has(arabic.toLowerCase())) {
      commandHandler.aliases.set(arabic.toLowerCase(), command);
    }
    if (Array.isArray(target.aliases) && !target.aliases.includes(arabic)) {
      target.aliases.push(arabic);
    }

    // خلي الأوامر العربية تشتغل من غير نقطة.
    commandHandler.prefixlessCommands.set(arabic.toLowerCase(), command);
  }
}

const timer = setInterval(() => {
  attachAliases();
  if (commandHandler.commands.size > 0) {
    // نكرر لفترة قصيرة فقط حتى تلحق كل الإضافات بالتحميل.
    setTimeout(() => clearInterval(timer), 3000);
  }
}, 100);

export default {};
