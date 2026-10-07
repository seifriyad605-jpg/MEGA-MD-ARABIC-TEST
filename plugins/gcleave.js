export default {
    command: 'gcleave',
    aliases: ['leavegroup', 'groupleave', 'leavegc'],
    category: 'owner',
    description: 'إخراج البوت من الجروب',
    usage: '.groupleave — leave current group\n.groupleave <jid> — leave specific group',
    ownerOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const channelInfo = context.channelInfo || {};
        const targetJid = args[0]?.includes('@g.us') ? args[0] : chatId;
        if (!targetJid.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, {
                text: `❌ هذا الأمر يعمل داخل الجروبات فقط.\n\nTo leave a specific group: \`.groupleave 1234567890-1234567890@g.us\``,
                ...channelInfo
            }, { quoted: message });
        }
        try {
            await sock.sendMessage(targetJid, {
                text: `👋 *البوت سيغادر الجروب.*\n\n_مع السلامة يا جماعة!_`,
                ...channelInfo
            });
            await new Promise(r => setTimeout(r, 500));
            await sock.groupLeave(targetJid);
            // If triggered from another chat, confirm there
            if (targetJid !== chatId) {
                await sock.sendMessage(chatId, {
                    text: `✅ تم مغادرة الجروب: \`${targetJid}\``,
                    ...channelInfo
                }, { quoted: message });
            }
        }
        catch (e) {
            console.error('[GROUPLEAVE] Error:', e.message);
            await sock.sendMessage(chatId, {
                text: `❌ فشل مغادرة الجروب: ${e.message}`,
                ...channelInfo
            }, { quoted: message });
        }
    }
};
