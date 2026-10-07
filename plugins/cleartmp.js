import fs from 'fs';
import path from 'path';
import isOwnerOrSudo from '../lib/isOwner.js';
function clearDirectory(dirPath) {
    try {
        if (!fs.existsSync(dirPath)) {
            return { success: false, message: `المجلد غير موجود: ${path.basename(dirPath)}` };
        }
        const files = fs.readdirSync(dirPath);
        let deletedCount = 0;
        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stat = fs.lstatSync(filePath);
            if (stat.isDirectory()) {
                fs.rmSync(filePath, { recursive: true, force: true });
            }
            else {
                fs.unlinkSync(filePath);
            }
            deletedCount++;
        }
        return {
            success: true,
            message: `تم حذف ${deletedCount} عناصر من ${path.basename(dirPath)}`,
            count: deletedCount
        };
    }
    catch (err) {
        console.error('clearDirectory error:', err);
        return {
            success: false,
            message: `فشل حذف ${path.basename(dirPath)}`
        };
    }
}
async function clearTmpDirectory() {
    const tmpDir = path.join(process.cwd(), 'tmp');
    const tempDir = path.join(process.cwd(), 'temp');
    const results = [
        clearDirectory(tmpDir),
        clearDirectory(tempDir)
    ];
    const success = results.every(r => r.success);
    const totalDeleted = results.reduce((a, b) => a + (b.count || 0), 0);
    const message = results.map(r => r.message).join(' | ');
    return { success, message, totalDeleted };
}
export default {
    command: 'cleartmp',
    aliases: ['cleartemp', 'tmpclear'],
    category: 'owner',
    description: 'حذف مجلدي tmp وtemp',
    usage: '.cleartmp',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const senderId = message.key.participant || message.key.remoteJid;
        try {
            const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
            if (!message.key.fromMe && !isOwner) {
                await sock.sendMessage(chatId, {
                    text: '*This command is only for the owner!*'
                }, { quoted: message });
                return;
            }
            const result = await clearTmpDirectory();
            const text = result.success
                ? `✅ *Temporary Files تم حذف!*\n\n${result.message}`
                : `❌ *فشل الحذف!*\n\n${result.message}`;
            await sock.sendMessage(chatId, {
                text
            }, { quoted: message });
        }
        catch (error) {
            console.error('Error in cleartmp command:', error);
            await sock.sendMessage(chatId, {
                text: '❌ فشل حذف الملفات المؤقتة!'
            }, { quoted: message });
        }
    }
};
function startAutoClear() {
    clearTmpDirectory();
    setInterval(clearTmpDirectory, 1 * 60 * 60 * 1000);
}
startAutoClear();
