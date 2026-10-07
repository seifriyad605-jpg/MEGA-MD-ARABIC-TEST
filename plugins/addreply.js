import { initConfig, saveConfig } from './autoreply.js';
export default {
    command: 'addreply',
    aliases: ['newtrigger', 'setreply'],
    category: 'owner',
    description: 'إضافة رد تلقائي عند كلمة معينة',
    usage: '.addreply <trigger> | <response>\nللتطابق الكامل: .addreply exact:<trigger> | <response>\nاستخدم {name} في الرد لمنشن اسم المرسل',
    ownerOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const senderId = context.senderId || message.key.remoteJid;
        const channelInfo = context.channelInfo || {};
        const fullText = args.join(' ');
        const pipeIndex = fullText.indexOf('|');
        if (!fullText || pipeIndex === -1) {
            return await sock.sendMessage(chatId, {
                text: `*➕ إضافة رد تلقائي*\n\n` +
                    `*طريقة الاستخدام:*\n` +
                    `\`.addreply <trigger> | <response>\`\n\n` +
                    `*أمثلة:*\n` +
                    `• \`.addreply hello | Hi there! 👋\`\n` +
                    `• \`.addreply exact:good morning | Good morning! ☀️\`\n` +
                    `• \`.addreply hi | Hello {name}! How are you?\`\n\n` +
                    `*ملاحظات:*\n` +
                    `• Use \`exact:\` prefix for full message match\n` +
                    `• Without \`exact:\` it matches if message *contains* trigger\n` +
                    `• Use \`{name}\` in response to mention the sender's name`,
                ...channelInfo
            }, { quoted: message });
        }
        let trigger = fullText.substring(0, pipeIndex).trim();
        const response = fullText.substring(pipeIndex + 1).trim();
        if (!trigger || !response) {
            return await sock.sendMessage(chatId, {
                text: '❌ لازم تكتب الكلمة والرد.\n\nExample: `.addreply hello | Hi there!`',
                ...channelInfo
            }, { quoted: message });
        }
        let exactMatch = false;
        if (trigger.toLowerCase().startsWith('exact:')) {
            exactMatch = true;
            trigger = trigger.substring(6).trim();
        }
        if (!trigger) {
            return await sock.sendMessage(chatId, {
                text: '❌ لا يمكن ترك الكلمة فارغة بعد `exact:`.',
                ...channelInfo
            }, { quoted: message });
        }
        const config = await initConfig();
        const exists = config.replies.find(r => r.trigger === trigger.toLowerCase());
        if (exists) {
            return await sock.sendMessage(chatId, {
                text: `⚠️ يوجد رد بالفعل للكلمة *"${trigger}"* موجودة بالفعل!\n\nUse \`.delreply ${trigger}\` to remove it first.`,
                ...channelInfo
            }, { quoted: message });
        }
        config.replies.push({
            trigger: trigger.toLowerCase(),
            response,
            exactMatch,
            addedBy: senderId,
            createdAt: Date.now()
        });
        await saveConfig(config);
        await sock.sendMessage(chatId, {
            text: `✅ *تمت إضافة الرد التلقائي!*\n\n` +
                `🔑 *الكلمة:* ${trigger}\n` +
                `🎯 *نوع المطابقة:* ${exactMatch ? 'مطابقة كاملة' : 'يحتوي على الكلمة'}\n` +
                `💬 *الرد:* ${response}`,
            ...channelInfo
        }, { quoted: message });
    }
};
