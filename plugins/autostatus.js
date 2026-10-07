import fs from 'fs';
import path from 'path';
import { dataFile } from '../lib/paths.js';
import store from '../lib/lightweight_store.js';
const MONGO_URL = process.env.MONGO_URL;
const POSTGRES_URL = process.env.POSTGRES_URL;
const MYSQL_URL = process.env.MYSQL_URL;
const SQLITE_URL = process.env.DB_URL;
const HAS_DB = !!(MONGO_URL || POSTGRES_URL || MYSQL_URL || SQLITE_URL);
const configPath = dataFile('autoStatus.json');
if (!HAS_DB && !fs.existsSync(configPath)) {
    if (!fs.existsSync(path.dirname(configPath))) {
        fs.mkdirSync(path.dirname(configPath), { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify({
        enabled: false,
        reactOn: false
    }, null, 2));
}
const channelInfo = {
    contextInfo: {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363319098372999@newsletter',
            newsletterName: 'GlobalTechInc',
            serverMessageId: -1
        }
    }
};
async function readConfig() {
    try {
        if (HAS_DB) {
            const config = await store.getSetting('global', 'autoStatus');
            return config || { enabled: false, reactOn: false };
        }
        else {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            return {
                enabled: !!config.enabled,
                reactOn: !!config.reactOn
            };
        }
    }
    catch (error) {
        console.error('Error reading auto status config:', error);
        return { enabled: false, reactOn: false };
    }
}
async function writeConfig(config) {
    try {
        if (HAS_DB) {
            await store.saveSetting('global', 'autoStatus', config);
        }
        else {
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        }
    }
    catch (error) {
        console.error('Error writing auto status config:', error);
    }
}
async function isAutoStatusEnabled() {
    const config = await readConfig();
    return config.enabled;
}
async function isStatusReactionEnabled() {
    const config = await readConfig();
    return config.reactOn;
}
async function reactToStatus(sock, statusKey) {
    try {
        const enabled = await isStatusReactionEnabled();
        if (!enabled) {
            return;
        }
        await sock.relayMessage('status@broadcast', {
            reactionMessage: {
                key: {
                    remoteJid: 'status@broadcast',
                    id: statusKey.id,
                    participant: statusKey.participant || statusKey.remoteJid,
                    fromMe: false
                },
                text: '💚'
            }
        }, {
            messageId: statusKey.id,
            statusJidList: [statusKey.remoteJid, statusKey.participant || statusKey.remoteJid]
        });
        console.log('✅ Reacted to status');
    }
    catch (error) {
        console.error('❌ Error reacting to status:', error.message);
    }
}
async function handleStatusUpdate(sock, status) {
    try {
        const enabled = await isAutoStatusEnabled();
        if (!enabled) {
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (status.messages && status.messages.length > 0) {
            const msg = status.messages[0];
            if (msg.key && msg.key.remoteJid === 'status@broadcast') {
                try {
                    await sock.readMessages([msg.key]);
                    console.log('✅ Viewed status from messages');
                    await reactToStatus(sock, msg.key);
                }
                catch (err) {
                    if (err.message?.includes('rate-overlimit')) {
                        console.log('⚠️ Rate limit hit, waiting before retrying...');
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        await sock.readMessages([msg.key]);
                    }
                    else {
                        throw err;
                    }
                }
                return;
            }
        }
        if (status.key && status.key.remoteJid === 'status@broadcast') {
            try {
                await sock.readMessages([status.key]);
                console.log('✅ Viewed status from key');
                await reactToStatus(sock, status.key);
            }
            catch (err) {
                if (err.message?.includes('rate-overlimit')) {
                    console.log('⚠️ Rate limit hit, waiting before retrying...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await sock.readMessages([status.key]);
                }
                else {
                    throw err;
                }
            }
            return;
        }
        if (status.reaction && status.reaction.key.remoteJid === 'status@broadcast') {
            try {
                await sock.readMessages([status.reaction.key]);
                console.log('✅ Viewed status from reaction');
                await reactToStatus(sock, status.reaction.key);
            }
            catch (err) {
                if (err.message?.includes('rate-overlimit')) {
                    console.log('⚠️ Rate limit hit, waiting before retrying...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await sock.readMessages([status.reaction.key]);
                }
                else {
                    throw err;
                }
            }
        }
    }
    catch (error) {
        console.error('❌ Error in auto status view:', error.message);
    }
}
export default {
    command: 'autostatus',
    aliases: ['autoview', 'statusview'],
    category: 'owner',
    description: 'عرض حالات واتساب والتفاعل معها تلقائيًا',
    usage: '.autostatus <on|off|react on|react off>',
    ownerOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        try {
            const config = await readConfig();
            if (!args || args.length === 0) {
                const viewStatus = config.enabled ? '✅ Enabled' : '❌ Disabled';
                const reactStatus = config.reactOn ? '✅ Enabled' : '❌ Disabled';
                await sock.sendMessage(chatId, {
                    text: `🔄 *إعدادات الحالة التلقائية*\n\n` +
                        `📱 *عرض الحالة تلقائيًا:* ${viewStatus}\n` +
                        `💫 *التفاعل مع الحالات:* ${reactStatus}\n` +
                        `🗄️ *Storage:* ${HAS_DB ? 'Database' : 'File System'}\n\n` +
                        `*Commands:*\n` +
                        `• \`.autostatus on\` - تشغيل العرض التلقائي\n` +
                        `• \`.autostatus off\` - إيقاف العرض التلقائي\n` +
                        `• \`.autostatus react on\` - تشغيل التفاعل\n` +
                        `• \`.autostatus react off\` - إيقاف التفاعل`,
                    ...channelInfo
                }, { quoted: message });
                return;
            }
            const command = args[0].toLowerCase();
            if (command === 'on') {
                config.enabled = true;
                await writeConfig(config);
                await sock.sendMessage(chatId, {
                    text: '✅ *تم تشغيل عرض الحالات تلقائيًا!*\n\n' +
                        'البوت سيشاهد الآن حالات جميع جهات الاتصال تلقائيًا.',
                    ...channelInfo
                }, { quoted: message });
            }
            else if (command === 'off') {
                config.enabled = false;
                await writeConfig(config);
                await sock.sendMessage(chatId, {
                    text: '❌ *تم إيقاف عرض الحالات تلقائيًا!*\n\n' +
                        'البوت لن يشاهد الحالات تلقائيًا بعد الآن.',
                    ...channelInfo
                }, { quoted: message });
            }
            else if (command === 'react') {
                if (!args[1]) {
                    await sock.sendMessage(chatId, {
                        text: '❌ *من فضلك حدد on/off للتفاعل!*\n\n' +
                            'Usage: `.autostatus react on/off`',
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }
                const reactCommand = args[1].toLowerCase();
                if (reactCommand === 'on') {
                    config.reactOn = true;
                    await writeConfig(config);
                    await sock.sendMessage(chatId, {
                        text: '💫 *تم تشغيل التفاعل مع الحالات!*\n\n' +
                            'البوت سيتفاعل الآن مع تحديثات الحالة باستخدام 💚',
                        ...channelInfo
                    }, { quoted: message });
                }
                else if (reactCommand === 'off') {
                    config.reactOn = false;
                    await writeConfig(config);
                    await sock.sendMessage(chatId, {
                        text: '❌ *تم إيقاف التفاعل مع الحالات!*\n\n' +
                            'البوت لن يتفاعل مع تحديثات الحالة بعد الآن.',
                        ...channelInfo
                    }, { quoted: message });
                }
                else {
                    await sock.sendMessage(chatId, {
                        text: '❌ *أمر التفاعل غير صحيح!*\n\n' +
                            'Usage: `.autostatus react on/off`',
                        ...channelInfo
                    }, { quoted: message });
                }
            }
            else {
                await sock.sendMessage(chatId, {
                    text: '❌ *الأمر غير صحيح!*\n\n' +
                        '*Usage:*\n' +
                        '• `.autostatus on/off` - Enable/disable auto view\n' +
                        '• `.autostatus react on/off` - Enable/disable reactions',
                    ...channelInfo
                }, { quoted: message });
            }
        }
        catch (error) {
            console.error('Error in autostatus command:', error);
            await sock.sendMessage(chatId, {
                text: '❌ *حدث خطأ أثناء إدارة الحالة التلقائية!*\n\n' +
                    `Error: ${error.message}`,
                ...channelInfo
            }, { quoted: message });
        }
    },
    handleStatusUpdate,
    isAutoStatusEnabled,
    isStatusReactionEnabled,
    reactToStatus,
    readConfig,
    writeConfig
};
