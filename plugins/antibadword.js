import store from '../lib/lightweight_store.js';
async function getAntibadwordSettings(chatId) {
    const settings = await store.getSetting(chatId, 'antibadword');
    return settings || { enabled: false, words: [] };
}
async function saveAntibadwordSettings(chatId, settings) {
    await store.saveSetting(chatId, 'antibadword', settings);
}
async function handleAntiBadwordCommand(sock, chatId, message, match) {
    const args = match.trim().toLowerCase().split(/\s+/);
    const action = args[0];
    const settings = await getAntibadwordSettings(chatId);
    if (!action || action === 'status') {
        const status = settings.enabled ? '✅ مفعل' : '❌ متوقف';
        const wordCount = settings.words?.length || 0;
        await sock.sendMessage(chatId, {
            text: `*حالة منع الكلمات السيئة*\n\n` +
                `Status: ${status}\n` +
                `Blocked الكلمات: ${wordCount}\n\n` +
                `الاستخدام:\n` +
                `• \`.antibadword on\` - تشغيل\n` +
                `• \`.antibadword off\` - إيقاف\n` +
                `• \`.antibadword add <word>\` - إضافة كلمة\n` +
                `• \`.antibadword remove <word>\` - حذف كلمة\n` +
                `• \`.antibadword list\` - عرض كل الكلمات`
        }, { quoted: message });
        return;
    }
    if (action === 'on') {
        settings.enabled = true;
        await saveAntibadwordSettings(chatId, settings);
        await sock.sendMessage(chatId, {
            text: '✅ *Anti-Badword مفعل*\n\nسيتم حذف الرسائل التي تحتوي على كلمات محظورة.'
        }, { quoted: message });
        return;
    }
    if (action === 'off') {
        settings.enabled = false;
        await saveAntibadwordSettings(chatId, settings);
        await sock.sendMessage(chatId, {
            text: '❌ *Anti-Badword متوقف*\n\nفلتر الكلمات السيئة متوقف الآن.'
        }, { quoted: message });
        return;
    }
    if (action === 'add') {
        const word = args.slice(1).join(' ').toLowerCase().trim();
        if (!word) {
            await sock.sendMessage(chatId, {
                text: '❌ *من فضلك اكتب كلمة لإضافتها*\n\nمثال: `.antibadword add badword`'
            }, { quoted: message });
            return;
        }
        if (!settings.words)
            settings.words = [];
        if (settings.words.includes(word)) {
            await sock.sendMessage(chatId, {
                text: `❌ *الكلمة موجودة بالفعل في القائمة*\n\n"${word}" محظورة بالفعل.`
            }, { quoted: message });
            return;
        }
        settings.words.push(word);
        await saveAntibadwordSettings(chatId, settings);
        await sock.sendMessage(chatId, {
            text: `✅ *تمت إضافة الكلمة*\n\nتمت إضافة "${word}" إلى قائمة الكلمات المحظورة.\n\nإجمالي الكلمات المحظورة: ${settings.words.length}`
        }, { quoted: message });
        return;
    }
    if (action === 'remove' || action === 'delete' || action === 'del') {
        const word = args.slice(1).join(' ').toLowerCase().trim();
        if (!word) {
            await sock.sendMessage(chatId, {
                text: '❌ *من فضلك اكتب كلمة لحذفها*\n\nمثال: `.antibadword remove badword`'
            }, { quoted: message });
            return;
        }
        if (!settings.words || !settings.words.includes(word)) {
            await sock.sendMessage(chatId, {
                text: `❌ *الكلمة غير موجودة*\n\n"${word}" ليست في قائمة الكلمات المحظورة.`
            }, { quoted: message });
            return;
        }
        settings.words = settings.words.filter((w) => w !== word);
        await saveAntibadwordSettings(chatId, settings);
        await sock.sendMessage(chatId, {
            text: `✅ *تم حذف الكلمة*\n\nتم حذف "${word}" من قائمة الكلمات المحظورة.\n\nالكلمات المحظورة المتبقية: ${settings.words.length}`
        }, { quoted: message });
        return;
    }
    if (action === 'list') {
        if (!settings.words || settings.words.length === 0) {
            await sock.sendMessage(chatId, {
                text: '📝 *قائمة الكلمات المحظورة*\n\nلا توجد كلمات محظورة حاليًا.\n\nUse `.antibadword add <word>` to add words.'
            }, { quoted: message });
            return;
        }
        const wordList = settings.words.map((w, i) => `${i + 1}. ${w}`).join('\n');
        await sock.sendMessage(chatId, {
            text: `📝 *قائمة الكلمات المحظورة*\n\n${wordList}\n\nالإجمالي: ${settings.words.length} words`
        }, { quoted: message });
        return;
    }
    await sock.sendMessage(chatId, {
        text: '❌ *أمر غير صحيح*\n\nالاستخدام:\n' +
            '• `.antibadword on/off`\n' +
            '• `.antibadword add <word>`\n' +
            '• `.antibadword remove <word>`\n' +
            '• `.antibadword list`'
    }, { quoted: message });
}
async function checkAntiBadword(sock, message) {
    const chatId = message.key.remoteJid;
    if (!chatId.endsWith('@g.us'))
        return false;
    const settings = await getAntibadwordSettings(chatId);
    if (!settings.enabled || !settings.words || settings.words.length === 0)
        return false;
    const messageText = (message.message?.conversation ||
        message.message?.extendedTextMessage?.text ||
        message.message?.imageMessage?.caption ||
        message.message?.videoMessage?.caption ||
        '').toLowerCase();
    if (!messageText)
        return false;
    for (const word of settings.words) {
        if (messageText.includes(word.toLowerCase())) {
            try {
                await sock.sendMessage(chatId, { delete: message.key });
                await sock.sendMessage(chatId, {
                    text: `❌ تم حذف الرسالة: تحتوي على كلمة محظورة "${word}"`
                });
                return true;
            }
            catch (error) {
                console.error('Error deleting badword message:', error);
            }
            break;
        }
    }
    return false;
}
export default {
    command: 'antibadword',
    aliases: ['abw', 'badword', 'antibad'],
    category: 'admin',
    description: 'إعداد فلتر لمنع الكلمات السيئة وحذف الرسائل التي تحتوي عليها',
    usage: '.antibadword <on|off|add|remove|list>',
    groupOnly: true,
    adminOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const match = args.join(' ');
        try {
            await handleAntiBadwordCommand(sock, chatId, message, match);
        }
        catch (error) {
            console.error('Error in antibadword command:', error);
            await sock.sendMessage(chatId, {
                text: '❌ *خطأ أثناء تنفيذ أمر منع الكلمات السيئة*\n\nحاول مرة أخرى لاحقًا.'
            }, { quoted: message });
        }
    }
};
export { handleAntiBadwordCommand };
export { checkAntiBadword };
