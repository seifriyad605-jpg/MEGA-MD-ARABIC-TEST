export default {
    command: 'gcset',
    aliases: ['gsetting', 'groupset', 'gpset'],
    category: 'admin',
    description: 'تغيير إعدادات الجروب (قفل/فتح الرسائل أو الإعدادات)',
    usage: '.gcset <setting>',
    groupOnly: true,
    adminOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const channelInfo = context.channelInfo || {};
        const isBotAdmin = context.isBotAdmin || false;
        if (!isBotAdmin) {
            return await sock.sendMessage(chatId, {
                text: `❌ البوت يحتاج أن يكون مشرفًا لتغيير إعدادات الجروب.`,
                ...channelInfo
            }, { quoted: message });
        }
        const setting = args[0]?.toLowerCase();
        if (!setting) {
            return await sock.sendMessage(chatId, {
                text: `╔════════════════╗\n` +
                    `║⚙️ *إعدادات الجروب*   ║\n` +
                    `╚════════════════╝\n\n` +
                    `📌 *Usage:* \`.gcset <option>\`\n\n` +
                    `────────────────────\n` +
                    `*💬 صلاحيات الرسائل*\n` +
                    `🔒 *lock* — المشرفون فقط يمكنهم إرسال الرسائل\n\n` +
                    `🔓 *unlock* — الجميع يمكنه إرسال الرسائل\n\n` +
                    `*🛠️ صلاحيات الإعدادات*\n` +
                    `🔒 *lockset* — المشرفون فقط يمكنهم تعديل معلومات الجروب\n\n` +
                    `🔓 *unlockset* — الجميع يمكنه تعديل معلومات الجروب\n` +
                    `────────────────────`,
                ...channelInfo
            }, { quoted: message });
        }
        const settingsMap = {
            lock: { value: 'announcement', label: '🔒 المشرفون فقط يمكنهم إرسال الرسائل' },
            unlock: { value: 'not_announcement', label: '🔓 الجميع يمكنه إرسال الرسائل' },
            lockset: { value: 'locked', label: '🔒 المشرفون فقط يمكنهم تعديل معلومات الجروب' },
            unlockset: { value: 'unlocked', label: '🔓 الجميع يمكنه تعديل معلومات الجروب' },
        };
        const config = settingsMap[setting];
        if (!config) {
            return await sock.sendMessage(chatId, {
                text: `❌ إعداد غير معروف: *${setting}*\n\nUse \`.groupsettings\` to see options.`,
                ...channelInfo
            }, { quoted: message });
        }
        try {
            await sock.groupSettingUpdate(chatId, config.value);
            return await sock.sendMessage(chatId, {
                text: `✅ ${config.label}`,
                ...channelInfo
            }, { quoted: message });
        }
        catch (e) {
            console.error('[GROUPSETTINGS] Error:', e.message);
            return await sock.sendMessage(chatId, {
                text: `❌ فشل تحديث الإعداد: ${e.message}`,
                ...channelInfo
            }, { quoted: message });
        }
    }
};
