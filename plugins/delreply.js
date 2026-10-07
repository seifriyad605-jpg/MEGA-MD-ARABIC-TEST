import { initConfig, saveConfig } from './autoreply.js';
export default {
    command: 'delreply',
    aliases: ['removereply', 'rmreply'],
    category: 'owner',
    description: 'حذف كلمة من الردود التلقائية',
    usage: '.delreply <trigger>',
    ownerOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const channelInfo = context.channelInfo || {};
        if (!args || args.length === 0) {
            return await sock.sendMessage(chatId, {
                text: '❌ من فضلك اكتب الكلمة التي تريد حذفها.\n\nUsage: `.delreply hello`\nSee all triggers: `.listreplies`',
                ...channelInfo
            }, { quoted: message });
        }
        const trigger = args.join(' ').toLowerCase().trim();
        const config = await initConfig();
        const before = config.replies.length;
        config.replies = config.replies.filter(r => r.trigger !== trigger);
        if (config.replies.length === before) {
            return await sock.sendMessage(chatId, {
                text: `❌ لم يتم العثور على رد تلقائي للكلمة *"${trigger}"*\n\nUse \`.listreplies\` لعرض كل الكلمات.`,
                ...channelInfo
            }, { quoted: message });
        }
        await saveConfig(config);
        await sock.sendMessage(chatId, {
            text: `🗑️ *تم حذف الرد التلقائي!*\n\nTrigger *"${trigger}"* تم حذفها.`,
            ...channelInfo
        }, { quoted: message });
    }
};
