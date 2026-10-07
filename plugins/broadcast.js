export default {
    command: 'broadcast',
    aliases: ['bc', 'announce'],
    category: 'owner',
    description: 'إرسال رسالة جماعية إلى كل الجروبات التي يوجد بها البوت',
    usage: '.broadcast <message>',
    ownerOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const channelInfo = context.channelInfo || {};
        const text = args.join(' ').trim();
        if (!text) {
            return await sock.sendMessage(chatId, {
                text: `*📢 رسالة جماعية*\n\n*Usage:* .broadcast <message>\n\n*Example:*\n.broadcast Hello everyone! Bot will be down for maintenance at 10 PM.\n\n_يتم إرسالها إلى كل الجروبات التي يوجد بها البوت. يوجد تأخير ثانية بين كل جروب لتجنب الحظر._`,
                ...channelInfo
            }, { quoted: message });
        }
        let groups = [];
        try {
            const allChats = Object.keys(sock.store?.chats || {});
            groups = allChats.filter(jid => jid.endsWith('@g.us'));
        }
        catch (e) {
            console.error('[رسالة جماعية] Error getting groups:', e.message);
        }
        if (groups.length === 0) {
            return await sock.sendMessage(chatId, {
                text: '❌ لم يتم العثور على جروبات. تأكد أن البوت موجود في جروب واحد على الأقل.',
                ...channelInfo
            }, { quoted: message });
        }
        await sock.sendMessage(chatId, {
            text: `📢 *جاري الإرسال إلى ${groups.length} group(s)...*\n\nقد يستغرق هذا بعض الوقت.`,
            ...channelInfo
        }, { quoted: message });
        const broadcastText = `📢 *رسالة جماعية MESSAGE*\n\n${text}`;
        let sent = 0;
        let failed = 0;
        for (const groupJid of groups) {
            try {
                await sock.sendMessage(groupJid, {
                    text: broadcastText,
                    contextInfo: {
                        forwardingScore: 1,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363319098372999@newsletter',
                            newsletterName: 'GlobalTechInc',
                            serverMessageId: -1
                        }
                    }
                });
                sent++;
            }
            catch (e) {
                console.error(`[رسالة جماعية] Failed to send to ${groupJid}: ${e.message}`);
                failed++;
            }
            // 1 second delay between sends to avoid WhatsApp rate limiting
            await new Promise(r => setTimeout(r, 1000));
        }
        await sock.sendMessage(chatId, {
            text: `✅ *اكتمل الإرسال الجماعي!*\n\n📤 تم الإرسال: ${sent}\n❌ فشل: ${failed}\n📊 الإجمالي: ${groups.length}`,
            ...channelInfo
        }, { quoted: message });
    }
};
