import store from '../lib/lightweight_store.js';
import isOwnerOrSudo from '../lib/isOwner.js';
import isAdmin from '../lib/isAdmin.js';
async function setAntilink(chatId, type, action) {
    try {
        await store.saveSetting(chatId, 'antilink', {
            enabled: true,
            action,
            type
        });
        return true;
    }
    catch (error) {
        console.error('Error setting antilink:', error);
        return false;
    }
}
async function getAntilink(chatId, _type) {
    try {
        const settings = await store.getSetting(chatId, 'antilink');
        return settings || null;
    }
    catch (error) {
        console.error('Error getting antilink:', error);
        return null;
    }
}
async function removeAntilink(chatId, _type) {
    try {
        await store.saveSetting(chatId, 'antilink', {
            enabled: false,
            action: null,
            type: null
        });
        return true;
    }
    catch (error) {
        console.error('Error removing antilink:', error);
        return false;
    }
}
export async function handleLinkDetection(sock, chatId, message, userMessage, senderId) {
    try {
        const config = await getAntilink(chatId, 'on');
        if (!config?.enabled)
            return;
        // Check if sender is owner or sudo
        const isOwnerSudo = await isOwnerOrSudo(senderId, sock, chatId);
        if (isOwnerSudo)
            return;
        // Check if sender is admin
        try {
            const { isSenderAdmin } = await isAdmin(sock, chatId, senderId);
            if (isSenderAdmin)
                return;
        }
        catch (e) { }
        const action = config.action || 'delete';
        let shouldAct = false;
        let linkType = '';
        const linkPatterns = {
            whatsappGroup: /chat\.whatsapp\.com\/[A-Za-z0-9]{20,}/i,
            whatsappChannel: /wa\.me\/channel\/[A-Za-z0-9]{20,}/i,
            telegram: /t\.me\/[A-Za-z0-9_]+/i,
            allLinks: /https?:\/\/\S+|www\.\S+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?/i,
        };
        if (linkPatterns.whatsappGroup.test(userMessage)) {
            shouldAct = true;
            linkType = 'WhatsApp Group';
        }
        else if (linkPatterns.whatsappChannel.test(userMessage)) {
            shouldAct = true;
            linkType = 'WhatsApp Channel';
        }
        else if (linkPatterns.telegram.test(userMessage)) {
            shouldAct = true;
            linkType = 'Telegram';
        }
        else if (linkPatterns.allLinks.test(userMessage)) {
            shouldAct = true;
            linkType = 'Link';
        }
        if (!shouldAct)
            return;
        const messageId = message.key.id;
        const participant = message.key.participant || senderId;
        if (action === 'delete' || action === 'kick') {
            try {
                await sock.sendMessage(chatId, {
                    delete: {
                        remoteJid: chatId,
                        fromMe: false,
                        id: messageId,
                        participant
                    }
                });
            }
            catch (error) {
                console.error('Failed to delete message:', error);
            }
        }
        if (action === 'warn' || action === 'delete') {
            await sock.sendMessage(chatId, {
                text: `⚠️ *منع الروابط تحذيرing*\n\n@${senderId.split('@')[0]}, posting ${linkType} links is not allowed!`,
                mentions: [senderId]
            });
        }
        if (action === 'kick') {
            try {
                await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                await sock.sendMessage(chatId, {
                    text: `🚫 @${senderId.split('@')[0]} has been removed for posting ${linkType} links.`,
                    mentions: [senderId]
                });
            }
            catch (error) {
                console.error('Failed to kick user:', error);
                await sock.sendMessage(chatId, {
                    text: `⚠️ Failed to remove user. Make sure the bot is an admin.`
                });
            }
        }
    }
    catch (error) {
        console.error('Error in link detection:', error);
    }
}
export default {
    command: 'antilink',
    aliases: ['alink', 'linkblock'],
    category: 'admin',
    description: 'Prevent users from sending links in the group',
    usage: '.antilink <on|off|set>',
    groupOnly: true,
    adminOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const action = args[0]?.toLowerCase();
        if (!action) {
            const config = await getAntilink(chatId, 'on');
            await sock.sendMessage(chatId, {
                text: `*🔗 ANTILINK SETUP*\n\n` +
                    `*الحالة الحالية:* ${config?.enabled ? '✅ Enabled' : '❌ Disabled'}\n` +
                    `*Current الإجراء:* ${config?.action || 'غير محدد'}\n\n` +
                    `*الأوامر:*\n` +
                    `• \`.antilink on\` - Enable antilink\n` +
                    `• \`.antilink off\` - Disable antilink\n` +
                    `• \`.antilink set delete\` - حذف link messages\n` +
                    `• \`.antilink set kick\` - طرد users who send links\n` +
                    `• \`.antilink set warn\` - تحذير users only\n\n` +
                    `*Protected Links:*\n` +
                    `• WhatsApp Groups\n` +
                    `• WhatsApp Channels\n` +
                    `• Telegram\n` +
                    `• All other links\n\n` +
                    `*Note:* Admins, Owner, and Sudo users are exempt.`
            }, { quoted: message });
            return;
        }
        switch (action) {
            case 'on':
                const existingConfig = await getAntilink(chatId, 'on');
                if (existingConfig?.enabled) {
                    await sock.sendMessage(chatId, {
                        text: '⚠️ *منع الروابط is already enabled*'
                    }, { quoted: message });
                    return;
                }
                const result = await setAntilink(chatId, 'on', 'delete');
                await sock.sendMessage(chatId, {
                    text: result ? '✅ *منع الروابط enabled successfully!*\n\nDefault action: حذف messages\n\n*Exempt:* Admins, Owner, Sudo users' : '❌ *Failed to enable antilink*'
                }, { quoted: message });
                break;
            case 'off':
                await removeAntilink(chatId, 'on');
                await sock.sendMessage(chatId, {
                    text: '❌ *منع الروابط disabled*\n\nUsers can now send links freely.'
                }, { quoted: message });
                break;
            case 'set':
                if (args.length < 2) {
                    await sock.sendMessage(chatId, {
                        text: '❌ *من فضلك حدد an action*\n\nUsage: `.antilink set delete | kick | warn`'
                    }, { quoted: message });
                    return;
                }
                const setAction = args[1].toLowerCase();
                if (!['delete', 'kick', 'warn'].includes(setAction)) {
                    await sock.sendMessage(chatId, {
                        text: '❌ *إجراء غير صحيح*\n\nChoose: delete, kick, or warn'
                    }, { quoted: message });
                    return;
                }
                const setResult = await setAntilink(chatId, 'on', setAction);
                const actionDescriptions = {
                    delete: 'حذف link messages and warn users',
                    kick: 'حذف messages and remove users',
                    warn: 'Only send warning messages'
                };
                await sock.sendMessage(chatId, {
                    text: setResult
                        ? `✅ *منع الروابط action set to: ${setAction}*\n\n${actionDescriptions[setAction]}\n\n*Exempt:* Admins, Owner, Sudo users`
                        : '❌ *Failed to set antilink action*'
                }, { quoted: message });
                break;
            case 'status':
            case 'get':
                const status = await getAntilink(chatId, 'on');
                await sock.sendMessage(chatId, {
                    text: `*🔗 ANTILINK STATUS*\n\n` +
                        `*Status:* ${status?.enabled ? '✅ Enabled' : '❌ Disabled'}\n` +
                        `*الإجراء:* ${status?.action || 'غير محدد'}\n\n` +
                        `*What happens when links are detected:*\n` +
                        `${status?.action === 'delete' ? '• يتم حذف الرسالة\n• يحصل المستخدم على تحذير' : ''}` +
                        `${status?.action === 'kick' ? '• يتم حذف الرسالة\n• يتم طرد المستخدم من الجروب' : ''}` +
                        `${status?.action === 'warn' ? '• يحصل المستخدم على تحذير\n• Message stays' : ''}\n\n` +
                        `*Exempt:* Admins, Owner, Sudo users`
                }, { quoted: message });
                break;
            default:
                await sock.sendMessage(chatId, {
                    text: '❌ *أمر غير صحيح*\n\nUse `.antilink` to see available options.'
                }, { quoted: message });
        }
    },
    handleLinkDetection,
    setAntilink,
    getAntilink,
    removeAntilink
};
