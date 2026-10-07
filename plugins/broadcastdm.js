export default {
    command: 'broadcastdm',
    aliases: ['bcdm', 'announcedm', 'dmall'],
    category: 'owner',
    description: 'إرسال رسالة جماعية إلى جميع جهات الاتصال المحفوظة',
    usage: '.broadcastdm <message>',
    ownerOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const channelInfo = context.channelInfo || {};
        const text = args.join(' ').trim();
        if (!text) {
            return await sock.sendMessage(chatId, {
                text: `*📩 رسالة جماعية DM*\n\n*Usage:* .broadcastdm <message>\n\n*Example:*\n.broadcastdm Hey! Check out our new features!\n\n_يتم إرسالها إلى جميع جهات الاتصال الموجودة في قائمة البوت. Has a 1.5s delay between each to avoid ban._`,
                ...channelInfo
            }, { quoted: message });
        }
        let contacts = [];
        try {
            const allContacts = Object.keys(sock.store?.contacts || {});
            contacts = allContacts.filter(jid => jid.endsWith('@s.whatsapp.net') &&
                jid !== sock.user?.id);
        }
        catch (e) {
            console.error('[رسالة جماعيةDM] Error getting contacts:', e.message);
        }
        if (contacts.length === 0) {
            return await sock.sendMessage(chatId, {
                text: '❌ No contacts found in the bot\'s contact list.',
                ...channelInfo
            }, { quoted: message });
        }
        await sock.sendMessage(chatId, {
            text: `📩 *جاري الإرسال إلى ${contacts.length} contact(s)...*\n\nقد يستغرق هذا بعض الوقت.`,
            ...channelInfo
        }, { quoted: message });
        const broadcastText = `📩 *MESSAGE*\n\n${text}`;
        let sent = 0;
        let failed = 0;
        for (const contactJid of contacts) {
            try {
                await sock.sendMessage(contactJid, {
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
                console.error(`[رسالة جماعيةDM] Failed to send to ${contactJid}: ${e.message}`);
                failed++;
            }
            // 1.5 second delay between DMs
            await new Promise(r => setTimeout(r, 1500));
        }
        await sock.sendMessage(chatId, {
            text: `✅ *DM اكتمل الإرسال الجماعي!*\n\n📤 تم الإرسال: ${sent}\n❌ فشل: ${failed}\n📊 الإجمالي: ${contacts.length}`,
            ...channelInfo
        }, { quoted: message });
    }
};
