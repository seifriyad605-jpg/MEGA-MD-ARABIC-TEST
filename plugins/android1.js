import pkg from 'api-qasim';
const QasimAny = pkg;
import axios from 'axios';
export default {
    command: 'apkdl',
    aliases: ['apk', 'an1apk', 'appdl', 'app'],
    category: 'download',
    description: 'البحث عن تطبيقات APK وتحميلها بالرد',
    usage: '.apkdl <apk_name>',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const query = args.join(' ').trim();
        try {
            if (!query) {
                return await sock.sendMessage(chatId, { text: '*من فضلك اكتب اسم تطبيق APK.*\nمثال: .apkdl Telegram' }, { quoted: message });
            }
            await sock.sendMessage(chatId, { text: '🔎 🔎 جاري البحث عن تطبيقات APK...' }, { quoted: message });
            const res = await QasimAny.apksearch(query);
            if (!res?.data || !Array.isArray(res.data) || res.data.length === 0) {
                return await sock.sendMessage(chatId, { text: '❌ ❌ لم يتم العثور على تطبيقات APK.' }, { quoted: message });
            }
            const results = res.data;
            const first = results[0];
            let caption = `📱 *نتائج البحث عن APK:* *${query}*\n\n`;
            caption += `↩️ *قم بالرد برقم للتحميل*\n\n`;
            results.forEach((item, i) => {
                caption +=
                    `*${i + 1}.* ${item.judul}\n` +
                        `👨‍💻 المطور: ${item.dev}\n` +
                        `⭐ التقييم: ${item.rating}\n` +
                        `🔗 ${item.link}\n\n`;
            });
            const sentMsg = await sock.sendMessage(chatId, { image: { url: first.thumb }, caption }, { quoted: message });
            const timeout = setTimeout(async () => {
                sock.ev.off('messages.upsert', listener);
                await sock.sendMessage(chatId, { text: '⏱ انتهى وقت اختيار APK. ابحث مرة أخرى.' }, { quoted: sentMsg });
            }, 5 * 60 * 1000);
            const listener = async ({ messages }) => {
                const m = messages[0];
                if (!m?.message || m.key.remoteJid !== chatId)
                    return;
                const ctx = m.message?.extendedTextMessage?.contextInfo;
                if (!ctx?.stanzaId || ctx.stanzaId !== sentMsg.key.id)
                    return;
                const replyText = m.message.conversation ||
                    m.message.extendedTextMessage?.text ||
                    '';
                const choice = parseInt(replyText.trim(), 10);
                if (isNaN(choice) || choice < 1 || choice > results.length) {
                    return await sock.sendMessage(chatId, { text: `❌ اختيار غير صحيح. اختر 1-${results.length}.` }, { quoted: m });
                }
                clearTimeout(timeout);
                sock.ev.off('messages.upsert', listener);
                const selected = results[choice - 1];
                await sock.sendMessage(chatId, { text: `⬇️ جاري تحميل *${selected.judul}*...\n⏱ من فضلك انتظر...` }, { quoted: m });
                const apiUrl = `https://discardapi.dpdns.org/api/apk/dl/android1?apikey=guru&url=${ 
                    encodeURIComponent(selected.link)}`;
                const dlRes = await axios.get(apiUrl);
                const apk = dlRes.data?.result;
                if (!apk?.url) {
                    return await sock.sendMessage(chatId, { text: '❌ فشل الحصول على رابط تحميل APK.' }, { quoted: m });
                }
                const safeName = apk.name.replace(/[^\w.-]/g, '_');
                const apkCaption = `📦 *تم تحميل APK*\n\n` +
                    `📛 Name: ${apk.name}\n` +
                    `⭐ التقييم: ${apk.rating}\n` +
                    `📦 الحجم: ${apk.size}\n` +
                    `📱 أندرويد: ${apk.requirement}\n` +
                    `🧒 العمر: ${apk.rated}\n` +
                    `📅 تاريخ النشر: ${apk.published}\n\n` +
                    `📝 الوصف:\n${apk.description}`;
                await sock.sendMessage(chatId, { document: { url: apk.url }, fileName: `${safeName}.apk`, mimetype: 'application/vnd.android.package-archive', caption: apkCaption }, { quoted: m });
            };
            sock.ev.on('messages.upsert', listener);
        }
        catch (err) {
            console.error('❌ Android Plugin Error:', err);
            await sock.sendMessage(chatId, { text: '❌ فشل تنفيذ طلب APK.' }, { quoted: message });
        }
    }
};
