import isAdmin from '../lib/isAdmin.js';
export default {
    command: 'clearchat',
    aliases: ['deletechat'],
    category: 'owner',
    description: 'حذف أو تنظيف المحادثة الحالية',
    usage: '.clearchat',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const channelInfo = context.channelInfo || {};
        const isGroup = chatId.endsWith('@g.us');
        const senderId = context.senderId || message.key.participant || message.key.remoteJid;
        const senderIsOwnerOrSudo = context.senderIsOwnerOrSudo || false;
        if (isGroup && !senderIsOwnerOrSudo) {
            // Fetch admin status directly — context.isSenderAdmin unreliable without adminOnly flag
            const { isSenderAdmin } = await isAdmin(sock, chatId, senderId);
            if (!isSenderAdmin) {
                return await sock.sendMessage(chatId, {
                    text: '❌ مشرفو الجروب أو مالك البوت فقط يمكنهم تنظيف المحادثة.',
                    ...channelInfo
                }, { quoted: message });
            }
        }
        if (!isGroup && !senderIsOwnerOrSudo && !message.key.fromMe) {
            return await sock.sendMessage(chatId, {
                text: '❌ مالك البوت فقط يمكنه تنظيف المحادثات الخاصة.',
                ...channelInfo
            }, { quoted: message });
        }
        try {
            await sock.chatModify({
                delete: true,
                lastMessages: [
                    {
                        key: message.key,
                        messageTimestamp: message.messageTimestamp
                    }
                ]
            }, chatId);
            await sock.sendMessage(chatId, {
                text: `🗑️ *تم تنظيف المحادثة بنجاح!*`,
                ...channelInfo
            }, { quoted: message });
        }
        catch (e) {
            console.error('[CLEARCHAT] Error:', e.message);
            await sock.sendMessage(chatId, {
                text: `❌ فشل تنظيف المحادثة: ${e.message}`,
                ...channelInfo
            }, { quoted: message });
        }
    }
};
