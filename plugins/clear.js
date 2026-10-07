export default {
    command: 'clear',
    aliases: ['clr', 'clean'],
    category: 'owner',
    description: 'حذف رسائل البوت من المحادثة',
    usage: '.clear',
    ownerOnly: true,
    async handler(sock, message, args, context) {
        const { chatId, channelInfo } = context;
        try {
            const sent = await sock.sendMessage(chatId, {
                text: 'جاري حذف رسائل البوت...',
                ...channelInfo
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
            await sock.sendMessage(chatId, { delete: sent.key });
        }
        catch (error) {
            console.error('Error clearing messages:', error);
            await sock.sendMessage(chatId, {
                text: 'حدث خطأ أثناء حذف الرسائل.',
                ...channelInfo
            }, { quoted: message });
        }
    }
};
