import { setAntitag, getAntitag, removeAntitag } from '../lib/index.js';
export async function handleTagDetection(sock, chatId, message, senderId) {
    try {
        const antitagSetting = await getAntitag(chatId, 'on');
        if (!antitagSetting || !antitagSetting.enabled)
            return;
        const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const messageText = (message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            message.message?.imageMessage?.caption ||
            message.message?.videoMessage?.caption ||
            '');
        const textMentions = messageText.match(/@[\d+\s\-()~.]+/g) || [];
        const numericMentions = messageText.match(/@\d{10,}/g) || [];
        const _allMentions = [...new Set([...mentionedJids, ...textMentions, ...numericMentions])];
        const uniqueNumericMentions = new Set();
        numericMentions.forEach((mention) => {
            const numMatch = mention.match(/@(\d+)/);
            if (numMatch)
                uniqueNumericMentions.add(numMatch[1]);
        });
        const mentionedJidCount = mentionedJids.length;
        const numericMentionCount = uniqueNumericMentions.size;
        const totalMentions = Math.max(mentionedJidCount, numericMentionCount);
        if (totalMentions >= 3) {
            const groupMetadata = await sock.groupMetadata(chatId);
            const participants = groupMetadata.participants || [];
            const mentionThreshold = Math.ceil(participants.length * 0.5);
            const hasManyNumericMentions = numericMentionCount >= 10 ||
                (numericMentionCount >= 5 && numericMentionCount >= mentionThreshold);
            if (totalMentions >= mentionThreshold || hasManyNumericMentions) {
                const action = antitagSetting.action || 'delete';
                if (action === 'delete') {
                    await sock.sendMessage(chatId, {
                        delete: {
                            remoteJid: chatId,
                            fromMe: false,
                            id: message.key.id,
                            participant: senderId
                        }
                    });
                    await sock.sendMessage(chatId, {
                        text: `⚠️ *Tagall Detected!*\n\n@${senderId.split('@')[0]}, tagging all members is not allowed.`,
                        منشن: [senderId]
                    });
                }
                else if (action === 'kick') {
                    await sock.sendMessage(chatId, {
                        delete: {
                            remoteJid: chatId,
                            fromMe: false,
                            id: message.key.id,
                            participant: senderId
                        }
                    });
                    try {
                        await sock.groupParticipantsUpdate(chatId, [senderId], "remove");
                        await sock.sendMessage(chatId, {
                            text: `🚫 *Antitag Action!*\n\n@${senderId.split('@')[0]} has been removed for tagging all members.`,
                            منشن: [senderId]
                        });
                    }
                    catch (error) {
                        await sock.sendMessage(chatId, {
                            text: `⚠️ Failed to remove user. Make sure the bot is an admin.`
                        });
                    }
                }
            }
        }
    }
    catch (error) {
        console.error('Error in tag detection:', error);
    }
}
export default {
    command: 'antitag',
    aliases: ['at', 'tagblock'],
    category: 'admin',
    description: 'منع المستخدمين من عمل منشن لكل أعضاء الجروب',
    usage: '.antitag <on|off|set>',
    groupOnly: true,
    adminOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const action = args[0]?.toLowerCase();
        if (!action) {
            const config = await getAntitag(chatId, 'on');
            await sock.sendMessage(chatId, {
                text: `*🏷️ إعدادات منع التاج الجماعي*\n\n` +
                    `*الحالة الحالية:* ${config?.enabled ? '✅ Enabled' : '❌ Disabled'}\n` +
                    `*Current الإجراء:* ${config?.action || 'غير محدد'}\n\n` +
                    `*الأوامر:*\n` +
                    `• \`.antitag on\` - Enable\n` +
                    `• \`.antitag off\` - Disable\n` +
                    `• \`.antitag set delete\` - حذف tagall messages\n` +
                    `• \`.antitag set kick\` - طرد users who tagall\n\n` +
                    `*Detection:*\n` +
                    `• يكتشف منشن 50% أو أكثر من أعضاء الجروب\n` +
                    `• يكتشف أنماط التاج الجماعي للبوتات\n` +
                    `• يحمي من سبام المنشن`
            }, { quoted: message });
            return;
        }
        switch (action) {
            case 'on':
                const existingConfig = await getAntitag(chatId, 'on');
                if (existingConfig?.enabled) {
                    await sock.sendMessage(chatId, {
                        text: '⚠️ *منع التاج مفعل بالفعل*'
                    }, { quoted: message });
                    return;
                }
                const result = await setAntitag(chatId, 'on', 'delete');
                await sock.sendMessage(chatId, {
                    text: result
                        ? '✅ *تم تشغيل منع التاج بنجاح!*\n\nDefault action: حذف tagall messages'
                        : '❌ *فشل تشغيل منع التاج*'
                }, { quoted: message });
                break;
            case 'off':
                await removeAntitag(chatId, 'on');
                await sock.sendMessage(chatId, {
                    text: '❌ *تم إيقاف منع التاج*\n\nيمكن للمستخدمين الآن عمل منشن لكل الأعضاء.'
                }, { quoted: message });
                break;
            case 'set':
                if (args.length < 2) {
                    await sock.sendMessage(chatId, {
                        text: '❌ *من فضلك حدد an action*\n\nUsage: `.antitag set delete | kick`'
                    }, { quoted: message });
                    return;
                }
                const setAction = args[1].toLowerCase();
                if (!['delete', 'kick'].includes(setAction)) {
                    await sock.sendMessage(chatId, {
                        text: '❌ *إجراء غير صحيح*\n\nاختر: delete أو kick'
                    }, { quoted: message });
                    return;
                }
                const setResult = await setAntitag(chatId, 'on', setAction);
                const actionDescriptions = {
                    delete: 'حذف tagall messages and warn users',
                    kick: 'حذف messages and remove users from group'
                };
                await sock.sendMessage(chatId, {
                    text: setResult
                        ? `✅ *تم ضبط إجراء منع التاج على: ${setAction}*\n\n${actionDescriptions[setAction]}`
                        : '❌ *فشل ضبط إجراء منع التاج*'
                }, { quoted: message });
                break;
            case 'status':
            case 'get':
                const status = await getAntitag(chatId, 'on');
                await sock.sendMessage(chatId, {
                    text: `*🏷️ حالة منع التاج*\n\n` +
                        `*Status:* ${status?.enabled ? '✅ Enabled' : '❌ Disabled'}\n` +
                        `*الإجراء:* ${status?.action || 'غير محدد'}\n\n` +
                        `*ماذا يحدث عند اكتشاف التاج الجماعي:*\n` +
                        `${status?.action === 'delete' ? '• يتم حذف الرسالة\n• يحصل المستخدم على تحذير' : ''}` +
                        `${status?.action === 'kick' ? '• يتم حذف الرسالة\n• يتم طرد المستخدم من الجروب' : ''}\n\n` +
                        `*حد الاكتشاف:* 50% من أعضاء الجروب أو 10+ منشن`
                }, { quoted: message });
                break;
            default:
                await sock.sendMessage(chatId, {
                    text: '❌ *أمر غير صحيح*\n\nUse `.antitag` to see available options.'
                }, { quoted: message });
        }
    },
    handleTagDetection
};
