export default {
    command: 'flirt',
    aliases: ['flirty', 'pickuplines'],
    category: 'fun',
    description: 'الحصول على رسالة غزل عشوائية',
    usage: '.flirt',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        try {
            const shizokeys = 'shizo';
            const res = await fetch(`https://shizoapi.onrender.com/api/texts/flirt?apikey=${shizokeys}`);
            if (!res.ok)
                throw await res.text();
            const r = await res.json();
            await sock.sendMessage(chatId, { text: r.result }, { quoted: message });
        }
        catch (e) {
            console.error('Error in flirt command:', e);
            await sock.sendMessage(chatId, { text: '❌ فشل الحصول على رسالة غزل. حاول مرة أخرى لاحقًا!' }, { quoted: message });
        }
    }
};
