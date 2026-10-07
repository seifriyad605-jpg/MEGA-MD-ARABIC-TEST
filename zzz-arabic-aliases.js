import commandHandler from '../lib/commandHandler.js';

const arabicAliases = {
  menu: ['قائمة', 'الاوامر', 'الأوامر', 'اوامر', 'مساعدة', 'مساعده'],
  ping: ['بنق', 'بينج'], alive: ['حي', 'الحالة', 'حاله'], owner: ['المالك', 'صاحب'],
  help: ['مساعدة', 'مساعده'], gpt: ['ذكاء', 'ذكاءاصطناعي', 'شات'], ai: ['ذكاء'],
  sticker: ['ملصق', 'ستيكر'], stickers: ['ملصقات', 'ستيكرات'], toimg: ['صورة'],
  tts: ['نطق', 'تحويلصوت'], translate: ['ترجمة', 'ترجم'], weather: ['الطقس', 'جو'],
  news: ['اخبار', 'أخبار'], quote: ['اقتباس', 'حكمة'], joke: ['نكتة', 'نكت'], meme: ['ميم', 'ميمز'],
  truth: ['حقيقة'], dare: ['تحدي'], tagall: ['منشنالكل', 'منشن'], promote: ['ترقية', 'رفعادمن'],
  demote: ['خفضادمن', 'إزالةادمن'], kick: ['طرد'], add: ['اضافة', 'إضافة'], mute: ['كتم'],
  unmute: ['الغاءالكتم', 'إلغاءالكتم'], warn: ['تحذير'], warnings: ['التحذيرات'], ban: ['حظر'],
  unban: ['الغاءالحظر', 'إلغاءالحظر'], groupinfo: ['معلوماتالمجموعة', 'معلوماتالجروب'],
  setgname: ['اسمالمجموعة', 'اسمالجروب'], setgdesc: ['وصفالمجموعة', 'وصفالجروب'],
  setgpp: ['صورةالمجموعة', 'صورةالجروب'], antilink: ['منعالروابط'], antibadword: ['منعالكلمات'],
  qrcode: ['باركود', 'كودQR'], base64: ['تشفير64', 'بيس64'], calc: ['حاسبة', 'حساب'],
  wiki: ['ويكي', 'ويكيبيديا'], define: ['تعريف', 'معنى'], screenshot: ['لقطةشاشة', 'سكرين'],
  speedtest: ['سرعةالنت'], echo: ['كرر'], script: ['السكريبت', 'المصدر'], gitclone: ['استنساخ'],
  reload: ['إعادةتحميل'], restart: ['إعادةتشغيل']
};

function attachAliases() {
  let remaining = 0;
  for (const [command, aliases] of Object.entries(arabicAliases)) {
    const target = commandHandler.commands.get(command);
    if (!target) { remaining++; continue; }
    for (const alias of aliases) {
      const key = alias.toLowerCase();
      if (!commandHandler.aliases.has(key)) commandHandler.aliases.set(key, command);
      if (Array.isArray(target.aliases) && !target.aliases.includes(alias)) target.aliases.push(alias);
    }
  }
  return remaining;
}

const timer = setInterval(() => {
  const remaining = attachAliases();
  if (remaining === 0) clearInterval(timer);
}, 100);

export default {};
