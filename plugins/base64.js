export default {
    command: 'base64',
    aliases: ['b64', 'encode'],
    category: 'tools',
    description: 'تحويل النص إلى Base64',
    usage: '.base64 <text> OR reply to a message',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        try {
            let txt = args?.join(' ') || "";
            const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (quoted) {
                txt = quoted.conversation ||
                    quoted.extendedTextMessage?.text ||
                    quoted.imageMessage?.caption ||
                    quoted.videoMessage?.caption ||
                    txt;
            }
            txt = txt.replace(/^\.\w+\s*/, '').trim();
            if (!txt) {
                return await sock.sendMessage(chatId, { text: '*من فضلك اكتب نصًا لتحويله أو قم بالرد على رسالة.*\nExample: .base64 Hello World' }, { quoted: message });
            }
            const encoded = Buffer.from(txt, 'utf-8').toString('base64');
            const response = `*🔗 تم تحويل النص إلى Base64:*\n\n${encoded}`;
            await sock.sendMessage(chatId, { text: response }, { quoted: message });
        }
        catch (err) {
            console.error('Base64 plugin error:', err);
            await sock.sendMessage(chatId, { text: '❌ فشل تحويل النص.' }, { quoted: message });
        }
    }
};
