import axios from 'axios';
export default { command: 'fact', aliases: ['randomfact', 'uselessfact'], category: 'fun', description: 'الحصول على معلومة عشوائية مثيرة للاهتمام', usage: '.fact', async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        try {
            const r = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en');
            await sock.sendMessage(chatId, { text: r.data.text }, { quoted: message });
        }
        catch (e) {
            console.error('Error fetching fact:', e);
            await sock.sendMessage(chatId, { text: 'عذرًا، لم أتمكن من جلب معلومة الآن.' }, { quoted: message });
        }
    } };
