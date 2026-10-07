export default {
    command: 'dado',
    aliases: ['dados', 'dice'],
    category: 'games',
    description: 'رمي ملصق نرد عشوائي',
    usage: '.dado',
    async handler(sock, message, _args, _context) {
        const chatId = message.key.remoteJid;
        const diceLinks = [
            'https://tinyurl.com/gdd01',
            'https://tinyurl.com/gdd02',
            'https://tinyurl.com/gdd003',
            'https://tinyurl.com/gdd004',
            'https://tinyurl.com/gdd05',
            'https://tinyurl.com/gdd006'
        ];
        const randomDice = diceLinks[Math.floor(Math.random() * diceLinks.length)];
        try {
            await sock.sendMessage(chatId, {
                sticker: { url: randomDice }
            }, { quoted: message });
        }
        catch (e) {
            console.error('خطأ في إضافة النرد:', e);
            await sock.sendMessage(chatId, {
                image: { url: randomDice },
                caption: '🎲 تم رمي النرد!'
            }, { quoted: message });
        }
    }
};
