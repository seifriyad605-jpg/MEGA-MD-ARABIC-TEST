import axios from 'axios';
export default {
    command: 'cyberimg',
    aliases: ['cyber', 'cyberspace'],
    category: 'images',
    description: 'الحصول على صورة فضاء إلكتروني عشوائية',
    usage: '.cyberimg',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        try {
            const res = await axios.get('https://raw.githubusercontent.com/GlobalTechInfo/Database/main/images/cyberspace.json');
            if (!res.data || !Array.isArray(res.data) || res.data.length === 0) {
                return await sock.sendMessage(chatId, { text: '❌ فشل جلب الصورة.' }, { quoted: message });
            }
            const randomImage = res.data[Math.floor(Math.random() * res.data.length)];
            await sock.sendMessage(chatId, { image: { url: randomImage }, caption: '🌐 صورة فضاء إلكتروني' }, { quoted: message });
        }
        catch (err) {
            console.error('Cyberspace image plugin error:', err);
            await sock.sendMessage(chatId, { text: '❌ حدث خطأ أثناء جلب الصورة.' }, { quoted: message });
        }
    }
};
