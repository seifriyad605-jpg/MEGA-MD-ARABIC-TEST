import axios from 'axios';
export default {
    command: 'element',
    aliases: ['atom', 'periodictable'],
    category: 'search',
    description: 'الحصول على معلومات عن عنصر كيميائي',
    usage: '.element <name or symbol>',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const query = args?.join(' ')?.trim();
        if (!query) {
            return await sock.sendMessage(chatId, { text: '*اكتب اسم العنصر أو رمزه.*\nExample: .element H' }, { quoted: message });
        }
        try {
            const { data: json } = await axios.get(`https://api.popcat.xyz/periodic-table?element=${encodeURIComponent(query)}`);
            if (!json?.name) {
                return await sock.sendMessage(chatId, { text: '❌ العنصر غير موجود.' }, { quoted: message });
            }
            const text = `🧪 *معلومات العنصر*\n` +
                `• الاسم: ${json.name}\n` +
                `• الرمز: ${json.symbol}\n` +
                `• العدد الذري: ${json.atomic_number}\n` +
                `• الكتلة الذرية: ${json.atomic_mass}\n` +
                `• الدورة: ${json.period}\n` +
                `• الحالة: ${json.phase}\n` +
                `• اكتشفه: ${json.discovered_by || 'غير معروف'}\n\n` +
                `📘 الملخص:\n${json.summary}`;
            await sock.sendMessage(chatId, { image: { url: json.image }, caption: text }, { quoted: message });
        }
        catch (error) {
            console.error('Element plugin error:', error);
            await sock.sendMessage(chatId, { text: '❌ فشل جلب معلومات العنصر.' }, { quoted: message });
        }
    }
};
