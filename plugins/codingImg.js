import axios from 'axios';
export default {
    command: 'coding',
    aliases: ['codingimg', 'programming', 'programmingimg'],
    category: 'images',
    description: 'الحصول على صورة برمجة عشوائية',
    usage: '.coding',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        try {
            const res = await axios.get('https://raw.githubusercontent.com/GlobalTechInfo/Database/main/images/coding.json');
            if (!res.data || !Array.isArray(res.data) || res.data.length === 0) {
                return await sock.sendMessage(chatId, { text: '❌ فشل جلب الصورة.' }, { quoted: message });
            }
            const randomImage = res.data[Math.floor(Math.random() * res.data.length)];
            await sock.sendMessage(chatId, { image: { url: randomImage }, caption: '💻 صورة برمجة' }, { quoted: message });
        }
        catch (err) {
            console.error('Programming image plugin error:', err);
            await sock.sendMessage(chatId, { text: '❌ حدث خطأ أثناء جلب الصورة.' }, { quoted: message });
        }
    }
};
