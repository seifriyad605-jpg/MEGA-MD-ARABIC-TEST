import axios from 'axios';
export default {
    command: 'getty',
    aliases: ['gettyvideo', 'gettydl'],
    category: 'download',
    description: 'تحميل فيديو أو صورة من Getty Images',
    usage: '.getty <Getty URL>',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const url = args?.[0];
        if (!url) {
            return await sock.sendMessage(chatId, { text: 'من فضلك اكتب رابط Getty.\nExample: .getty https://www.gettyimages.com/detail/video/482277170' }, { quoted: message });
        }
        try {
            const apiUrl = `https://discardapi.dpdns.org/api/dl/getty?apikey=guru&url=${encodeURIComponent(url)}`;
            const { data } = await axios.get(apiUrl, { timeout: 10000 });
            if (!data?.status || !data.result?.length) {
                return await sock.sendMessage(chatId, { text: '❌ لم يتم العثور على فيديو لهذا الرابط.' }, { quoted: message });
            }
            const videoUrl = data.result[0].video;
            const imageUrl = data.result[0].image;
            if (imageUrl) {
                await sock.sendMessage(chatId, { image: { url: imageUrl }, caption: '🖼️ صورة Getty المصغرة' }, { quoted: message });
            }
            if (videoUrl) {
                await sock.sendMessage(chatId, { video: { url: videoUrl }, caption: '🎬 فيديو Getty' }, { quoted: message });
            }
        }
        catch (error) {
            console.error('Getty plugin error:', error);
            if (error.code === 'ECONNABORTED') {
                await sock.sendMessage(chatId, { text: '❌ انتهت مهلة الطلب. قد تكون الخدمة بطيئة أو غير متاحة.' }, { quoted: message });
            }
            else {
                await sock.sendMessage(chatId, { text: '❌ فشل جلب فيديو Getty.' }, { quoted: message });
            }
        }
    }
};
