export default {
    command: 'archivechat',
    aliases: ['archive', 'unarchive', 'unarchivechat'],
    category: 'owner',
    description: 'أرشفة المحادثة الحالية أو إلغاء أرشفتها',
    usage: '.archivechat <archive|unarchive>',
    ownerOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const channelInfo = context.channelInfo || {};
        const rawText = context.rawText || '';
        // Auto-detect from command name
        const isUnarchive = rawText.toLowerCase().startsWith('.unarchive');
        const action = args[0]?.toLowerCase() || (isUnarchive ? 'unarchive' : 'archive');
        if (!['archive', 'unarchive'].includes(action)) {
            return await sock.sendMessage(chatId, {
                text: `*📦 أرشفة المحادثة*\n\n*طريقة الاستخدام:*\n• \`.archivechat archive\` — أرشفة هذه المحادثة\n• \`.archivechat unarchive\` — إلغاء أرشفة هذه المحادثة\n\n_أو استخدم الاختصارات: \`.archive\` / \`.unarchive\`_`,
                ...channelInfo
            }, { quoted: message });
        }
        const shouldArchive = action === 'archive';
        try {
            const lastMsg = message;
            await sock.chatModify({
                archive: shouldArchive,
                lastMessages: [
                    {
                        key: lastMsg.key,
                        messageTimestamp: lastMsg.messageTimestamp
                    }
                ]
            }, chatId);
            await sock.sendMessage(chatId, {
                text: shouldArchive
                    ? `📦 *تمت أرشفة المحادثة!*`
                    : `📂 *تم إلغاء أرشفة المحادثة!*`,
                ...channelInfo
            }, { quoted: message });
        }
        catch (e) {
            console.error('[ARCHIVECHAT] Error:', e.message);
            await sock.sendMessage(chatId, {
                text: `❌ فشل في ${action} المحادثة: ${e.message}`,
                ...channelInfo
            }, { quoted: message });
        }
    }
};
