export default {
    command: 'echo',
    aliases: [],
    category: 'general',
    description: 'يكرر رسالتك عددًا محددًا من المرات.',
    usage: '.echo <text> <count>',
    isPrefixless: true,
    async handler(sock, message, args) {
        const chatId = message.key.remoteJid;
        if (args.length < 2) {
            return await sock.sendMessage(chatId, { text: 'Usage: .echo <text> <count>' }, { quoted: message });
        }
        const count = parseInt(args[args.length - 1], 10);
        if (isNaN(count) || count <= 0) {
            return await sock.sendMessage(chatId, { text: 'العدد يجب أن يكون رقمًا موجبًا.' }, { quoted: message });
        }
        args.pop();
        const text = args.join(' ').trim();
        const repeated = Array(count).fill(text).join('\n');
        await sock.sendMessage(chatId, { text: repeated }, { quoted: message });
    }
};
