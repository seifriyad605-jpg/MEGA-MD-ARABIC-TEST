export default {
    command: 'channelid',
    aliases: ['newsletterid'],
    category: 'general',
    description: 'الحصول على المعرف الداخلي لقناة واتساب',
    usage: '.channelid <url>',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        let url = args[0] || "";
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quoted) {
            url = quoted.conversation || quoted.extendedTextMessage?.text || url;
        }
        if (!url || !url.includes('whatsapp.com/channel/')) {
            return await sock.sendMessage(chatId, {
                text: 'من فضلك اكتب رابط قناة واتساب صحيح.\n\n*Example:* .channelid https://whatsapp.com/channel/xxxxx'
            }, { quoted: message });
        }
        const code = url.split('/').pop();
        try {
            const metadata = await sock.newsletterMetadata("invite", code);
            const response = `
🆔 *JID:* ${metadata.id}
      `.trim();
            await sock.sendMessage(chatId, { text: response }, { quoted: message });
        }
        catch (err) {
            console.error('Channel ID خطأ:', err);
            await sock.sendMessage(chatId, {
                text: '❌ *فشل الحصول على المعرف:* This channel might be private, deleted, or the link is invalid.'
            }, { quoted: message });
        }
    }
};
