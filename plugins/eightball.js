export default {
    command: '8ball',
    aliases: ['eightball', 'magic8ball'],
    category: 'fun',
    description: 'اسأل كرة الحظ السحرية سؤالًا',
    usage: '.8ball Will I be rich?',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        try {
            const question = args.join(' ');
            if (!question) {
                await sock.sendMessage(chatId, {
                    text: '🎱 من فضلك اكتب سؤالًا!'
                }, { quoted: message });
                return;
            }
            const eightBallResponses = [
                "نعم بالتأكيد!",
                "مستحيل!",
                "اسأل مرة أخرى لاحقًا.",
                "هذا مؤكد.",
                "مستبعد جدًا.",
                "بلا شك.",
                "إجابتي هي لا.",
                "المؤشرات تقول نعم."
            ];
            const randomResponse = eightBallResponses[Math.floor(Math.random() * eightBallResponses.length)];
            await sock.sendMessage(chatId, {
                text: `🎱 *السؤال:* ${question}\n\n*الإجابة:* ${randomResponse}`
            }, { quoted: message });
        }
        catch (error) {
            console.error('Error in 8ball command:', error);
            await sock.sendMessage(chatId, {
                text: '❌ حدث خطأ في كرة الحظ السحرية!'
            }, { quoted: message });
        }
    }
};
