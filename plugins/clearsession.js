import fs from 'fs';
import path from 'path';
import isOwnerOrSudo from '../lib/isOwner.js';
import { channelInfo } from '../lib/messageConfig.js';
export default {
    command: 'clearsession',
    aliases: ['clearses', 'csession'],
    category: 'owner',
    description: 'حذف ملفات الجلسة',
    usage: '.clearsession',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        try {
            const senderId = message.key.participant || message.key.remoteJid;
            const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
            if (!message.key.fromMe && !isOwner) {
                return await sock.sendMessage(chatId, { text: '*هذا الأمر متاح للمالك فقط!*', ...channelInfo });
            }
            const sessionDir = path.join(process.cwd(), 'session');
            if (!fs.existsSync(sessionDir)) {
                return await sock.sendMessage(chatId, { text: '*مجلد الجلسة غير موجود!*', ...channelInfo });
            }
            let filesDeleted = 0;
            let errors = 0;
            const errorDetails = [];
            await sock.sendMessage(chatId, { text: '🔍 جاري تحسين ملفات الجلسة لتحسين الأداء...', ...channelInfo });
            const files = fs.readdirSync(sessionDir);
            let appStateSyncCount = 0;
            let preKeyCount = 0;
            for (const file of files) {
                if (file.startsWith('app-state-sync-'))
                    appStateSyncCount++;
                if (file.startsWith('pre-key-'))
                    preKeyCount++;
            }
            for (const file of files) {
                if (file === 'creds.json')
                    continue;
                if (file.startsWith('app-state-sync-key-'))
                    continue;
                try {
                    fs.unlinkSync(path.join(sessionDir, file));
                    filesDeleted++;
                }
                catch (err) {
                    errors++;
                    errorDetails.push(`Failed to delete ${file}: ${err.message}`);
                }
            }
            const msgText = `✅ تم حذف ملفات الجلسة بنجاح!\n\n` +
                `📊 الإحصائيات:\n` +
                `• إجمالي الملفات المحذوفة: ${filesDeleted}\n` +
                `• ملفات مزامنة حالة التطبيق: ${appStateSyncCount}\n` +
                `• ملفات المفاتيح المسبقة: ${preKeyCount}\n${ 
                errors > 0 ? `\n⚠️ أخطاء حدثت: ${errors}\n${errorDetails.join('\n')}` : ''}`;
            await sock.sendMessage(chatId, { text: msgText, ...channelInfo });
        }
        catch {
            await sock.sendMessage(chatId, { text: '❌ فشل حذف ملفات الجلسة!', ...channelInfo });
        }
    }
};
