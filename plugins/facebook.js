import axios from 'axios';
const AXIOS_DEFAULTS = {
    timeout: 60000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json, text/plain, */*'
    }
};
export default {
    command: 'facebook',
    aliases: ['fb', 'fbdl'],
    category: 'download',
    description: 'تحميل فيديوهات فيسبوك',
    usage: '.fb <facebook video link>',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const url = args.join(' ') ||
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text;
        try {
            if (!url) {
                return await sock.sendMessage(chatId, { text: '📘 *محمل فيسبوك*\n\nUsage:\n.fb <facebook video link>' }, { quoted: message });
            }
            if (!/facebook\.com|fb\.watch/i.test(url)) {
                return await sock.sendMessage(chatId, { text: '❌ رابط فيسبوك غير صحيح.\nمن فضلك أرسل رابط فيديو فيسبوك صحيحًا.' }, { quoted: message });
            }
            await sock.sendMessage(chatId, {
                react: { text: '🔄', key: message.key }
            });
            const apiUrl = `https://gtech-api-xtp1.onrender.com/api/download/fb?url=${encodeURIComponent(url)}&apikey=APIKEY`;
            const res = await axios.get(apiUrl, AXIOS_DEFAULTS);
            const videos = res?.data?.data?.data;
            if (!res?.data?.status || !Array.isArray(videos) || !videos.length) {
                throw new Error('لم يتم العثور على فيديو قابل للتحميل');
            }
            const sorted = videos.sort((a, b) => {
                const qa = parseInt(a.resolution, 10) || 0;
                const qb = parseInt(b.resolution, 10) || 0;
                return qb - qa;
            });
            const selected = sorted[0];
            const videoUrl = selected.url.startsWith('http')
                ? selected.url
                : `https://gtech-api-xtp1.onrender.com${selected.url}`;
            const caption = `📘 *محمل فيسبوك*
🎞 الجودة: *${selected.resolution || 'Unknown'}*

> *_Downloaded by MEGA-MD_*`;
            await sock.sendMessage(chatId, { video: { url: videoUrl }, mimetype: 'video/mp4', caption }, { quoted: message });
        }
        catch (err) {
            console.error('Facebook downloader error:', err);
            await sock.sendMessage(chatId, { text: '❌ فشل تحميل فيديو فيسبوك. حاول مرة أخرى لاحقًا.' }, { quoted: message });
        }
    }
};
