export default {
    command: 'getpp',
    aliases: ['dlpp', 'profilepic', 'getdp'],
    category: 'general',
    description: 'الحصول على صورة الملف الشخصي للمستخدم',
    usage: '.getpp @user or reply or number',
    async handler(sock, message, args, _context) {
        const chatId = message.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        let target;
        let displayName = 'Unknown';
        let displayNumber = '';
        const quoted = message.message?.extendedTextMessage?.contextInfo;
        if (quoted?.mentionedJid?.[0]) {
            target = quoted.mentionedJid[0];
        }
        else if (quoted?.participant) {
            target = quoted.participant;
            if (quoted.pushName)
                displayName = quoted.pushName;
        }
        else if (args[0]) {
            const input = args[0].replace(/[^0-9]/g, '');
            if (input.length >= 10) {
                target = `${input }@s.whatsapp.net`;
                displayName = ''; // Will be resolved later, don't show Unknown
            }
            else {
                return await sock.sendMessage(chatId, {
                    text: '❌ رقم غير صحيح. استخدم الصيغة: 923051234567 or +923051234567'
                }, { quoted: message });
            }
        }
        else {
            return await sock.sendMessage(chatId, {
                text: '📸 *الحصول على صورة الملف الشخصي*\n\nUsage:\n• Reply to a message\n• Mention someone: `.getpp @user`\n• Provide a number: `.getpp 923001234567`'
            }, { quoted: message });
        }
        try {
            let realJid = target;
            if (target.endsWith('@lid') && isGroup) {
                const metadata = await sock.groupMetadata(chatId);
                const participant = metadata.participants.find((p) => p.lid === target || p.id === target);
                if (participant?.id) {
                    realJid = participant.id;
                }
            }
            const cleanNumber = realJid.replace(/@s\.whatsapp\.net|@lid/g, '').split(':')[0];
            // Only show number if it looks like a real phone number (10+ digits)
            displayNumber = cleanNumber.length >= 10 ? `+${cleanNumber}` : '';
            if (displayName === 'Unknown') {
                try {
                    const name = await sock.getName(realJid);
                    if (name && !name.startsWith('+'))
                        displayName = name;
                }
                catch (e) { }
            }
            let ppUrl = null;
            try {
                ppUrl = await sock.profilePictureUrl(realJid, 'image');
            }
            catch (e) {
                return await sock.sendMessage(chatId, {
                    text: `❌ لا توجد صورة شخصية لـ *${displayName}* (${displayNumber})`
                }, { quoted: message });
            }
            if (ppUrl) {
                await sock.sendMessage(chatId, {
                    image: { url: ppUrl },
                    caption: `📸 *الصورة الشخصية*${displayName && displayName !== 'Unknown' ? `\n\n👤 *الاسم:* ${ displayName}` : ''}${displayNumber ? `\n📱 *الرقم:* ${ displayNumber}` : ''}`
                }, { quoted: message });
            }
        }
        catch (error) {
            console.error('GetPP Error:', error);
            await sock.sendMessage(chatId, {
                text: '❌ فشل جلب الصورة الشخصية.'
            }, { quoted: message });
        }
    }
};
