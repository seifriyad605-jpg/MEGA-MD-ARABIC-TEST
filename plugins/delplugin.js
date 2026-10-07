import { join } from 'path';
import { unlinkSync, readdirSync } from 'fs';
export default {
    command: 'delplugin',
    aliases: ['deleteplugin', 'rmplugin'],
    category: 'owner',
    description: 'حذف إضافة بالاسم (للمالك فقط)',
    usage: '.delplugin <plugin_name>',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        try {
            if (!args || !args[0]) {
                return await sock.sendMessage(chatId, {
                    text: `*🌟مثال على الاستخدام:*\n.delplugin main-menu`
                }, { quoted: message });
            }
            const pluginDir = join(process.cwd(), 'plugins');
            const pluginFiles = readdirSync(pluginDir).filter(f => f.endsWith('.js'));
            const pluginNames = pluginFiles.map(f => f.replace('.js', ''));
            if (!pluginNames.includes(args[0])) {
                return await sock.sendMessage(chatId, {
                    text: `🗃️ هذه الإضافة غير موجودة!\n\nالإضافات المتاحة:\n${pluginNames.join('\n')}`
                }, { quoted: message });
            }
            const filePath = join(pluginDir, `${args[0] }.js`);
            unlinkSync(filePath);
            await sock.sendMessage(chatId, { text: `⚠️ Plugin "${args[0]}.js" تم حذفها.` }, { quoted: message });
        }
        catch (err) {
            console.error('rmplugin error:', err);
            await sock.sendMessage(chatId, { text: `❌ فشل حذف الإضافة: ${err.message}`
            }, { quoted: message });
        }
    }
};
