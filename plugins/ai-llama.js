import axios from 'axios';
const AI_APIS = [
    (q) => `https://mistral.stacktoy.workers.dev/?apikey=Suhail&text=${encodeURIComponent(q)}`,
    (q) => `https://llama.gtech-apiz.workers.dev/?apikey=Suhail&text=${encodeURIComponent(q)}`,
    (q) => `https://mistral.gtech-apiz.workers.dev/?apikey=Suhail&text=${encodeURIComponent(q)}`
];
const askAI = async (query) => {
    for (const apiUrl of AI_APIS) {
        try {
            const { data } = await axios.get(apiUrl(query), { timeout: 15000 });
            const response = data?.data?.response;
            if (response && typeof response === 'string' && response.trim()) {
                return response.trim();
            }
        }
        catch {
            continue;
        }
    }
    throw new Error('All AI APIs failed');
};
export default {
    command: 'llama',
    aliases: ['ai', 'chat', 'ask'],
    category: 'ai',
    description: 'اسأل الذكاء الاصطناعي',
    usage: '.llama <question>',
    async handler(sock, message, args, context) {
        const { chatId, config } = context;
        const prefix = config.prefix;
        const query = args.join(' ').trim();
        if (!query) {
            return sock.sendMessage(chatId, { text: `🤖 *المساعد الذكي*\n\nطريقة الاستخدام: \`${prefix}llama <your question>\`\nExample: \`${prefix}llama explain quantum physics\`` }, { quoted: message });
        }
        try {
            await sock.sendMessage(chatId, { react: { text: '🤖', key: message.key } });
            const answer = await askAI(query);
            await sock.sendMessage(chatId, { text: answer }, { quoted: message });
        }
        catch (error) {
            console.error('AI Command Error:', error.message);
            await sock.sendMessage(chatId, { text: '❌ فشل الحصول على رد من الذكاء الاصطناعي. حاول مرة أخرى لاحقًا.' }, { quoted: message });
        }
    }
};
