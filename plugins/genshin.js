import axios from 'axios';
// Utility to decode Unicode escapes
function decodeUnicode(str) {
    if (!str)
        return 'N/A';
    return str.replace(/\\u[\dA-F]{4}/gi, (match) => String.fromCharCode(parseInt(match.replace("\\u", ""), 16)));
}
export default {
    command: 'genshin',
    aliases: ['gh', 'uid'],
    category: 'stalk',
    description: 'البحث عن معلومات UID في Genshin Impact',
    usage: '.genshin <UID>',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        if (!args.length) {
            return await sock.sendMessage(chatId, {
                text: '*من فضلك اكتب UID الخاص بـGenshin.*\nExample: .genshin 826401293'
            }, { quoted: message });
        }
        const uid = args[0];
        try {
            const { data } = await axios.get(`https://discardapi.dpdns.org/api/stalk/genshin`, {
                params: { apikey: 'guru', text: uid }
            });
            if (!data?.result) {
                return await sock.sendMessage(chatId, { text: '❌ الـUID غير موجود أو غير صحيح.' }, { quoted: message });
            }
            const result = data.result;
            const caption = `🎮 *معلومات UID في Genshin*\n\n` +
                `👤 الاسم المستعار: ${result.nickname || 'N/A'}\n` +
                `🆔 UID: ${result.uid || 'N/A'}\n` +
                `🏆 الإنجازات: ${result.achivement || 'N/A'}\n` +
                `⚡ المستوى: ${result.level || 'N/A'}\n` +
                `🌌 World المستوى: ${result.world_level || 'N/A'}\n` +
                `🌀 الهاوية الحلزونية: ${decodeUnicode(result.spiral_abyss)}\n` +
                `💳 معرف البطاقة: ${result.card_id || 'N/A'}`;
            await sock.sendMessage(chatId, { image: { url: result.image }, caption }, { quoted: message });
        }
        catch (err) {
            console.error('Genshin plugin error:', err);
            await sock.sendMessage(chatId, { text: '❌ فشل جلب معلومات UID.' }, { quoted: message });
        }
    }
};
