import axios from 'axios';
export default {
    command: 'define',
    aliases: ['dict', 'urban'],
    category: 'search',
    description: 'البحث عن كلمة في القاموس',
    usage: '.define <word>',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const query = args?.join(' ')?.trim();
        if (!query) {
            return await sock.sendMessage(chatId, { text: '*من فضلك اكتب كلمة للبحث عنها.*\nExample: .define hello' }, { quoted: message });
        }
        try {
            const url = `https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(query)}`;
            const { data: json } = await axios.get(url);
            if (!json?.list || json.list.length === 0) {
                return await sock.sendMessage(chatId, { text: '❌ الكلمة غير موجودة في القاموس.' }, { quoted: message });
            }
            const firstEntry = json.list[0];
            const definition = firstEntry.definition || 'لا يوجد تعريف متاح';
            const example = firstEntry.example ? `*Example:* ${firstEntry.example}` : '';
            const text = `🔍 *القاموس*\n\n*الكلمة:* ${query}\n*التعريف:* ${definition}\n${example}`;
            await sock.sendMessage(chatId, { text }, { quoted: message });
        }
        catch (error) {
            console.error('Urban plugin error:', error);
            await sock.sendMessage(chatId, { text: '❌ فشل جلب التعريف.', }, { quoted: message });
        }
    }
};
