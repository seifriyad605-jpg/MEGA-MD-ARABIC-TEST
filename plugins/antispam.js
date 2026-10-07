import fs from 'fs';
import path from 'path';
import { dataFile } from '../lib/paths.js';
import store from '../lib/lightweight_store.js';
import { channelInfo } from '../lib/messageConfig.js';
const MONGO_URL = process.env.MONGO_URL;
const POSTGRES_URL = process.env.POSTGRES_URL;
const MYSQL_URL = process.env.MYSQL_URL;
const SQLITE_URL = process.env.DB_URL;
const HAS_DB = !!(MONGO_URL || POSTGRES_URL || MYSQL_URL || SQLITE_URL);
const configPath = dataFile('antispam.json');
// ── In-memory flood tracker ────────────────────────────────────────────────
const tracker = new Map();
const metaCache = new Map();
const META_TTL_MS = 5 * 60 * 1000;
// 5 minutes
async function getParticipants(sock, chatId) {
    const cached = metaCache.get(chatId);
    if (cached && (Date.now() - cached.fetchedAt) < META_TTL_MS) {
        return cached.participants;
    }
    try {
        const metadata = await sock.groupMetadata(chatId);
        const participants = metadata?.participants || [];
        metaCache.set(chatId, { participants, fetchedAt: Date.now() });
        return participants;
    }
    catch (_e) {
        // Return cached even if stale, better than nothing
        return cached?.participants || [];
    }
}
function isParticipantAdmin(participants, jid) {
    if (!jid)
        return false;
    const num = jid.split('@')[0].split(':')[0];
    return participants.some((p) => {
        if (p.admin !== 'admin' && p.admin !== 'superadmin')
            return false;
        const pId = (p.id || '');
        const pLid = (p.lid || '');
        const pNum = pId.split('@')[0].split(':')[0];
        const pLidNum = pLid.split('@')[0].split(':')[0];
        const pPhone = p.phoneNumber ? p.phoneNumber.split('@')[0] : '';
        return (pId === jid ||
            pLid === jid ||
            pNum === num ||
            pLidNum === num ||
            pPhone === num);
    });
}
function getBotAdminStatus(participants, sock) {
    const botId = sock.user?.id || '';
    const botLid = sock.user?.lid || '';
    const botNum = botId.split('@')[0].split(':')[0];
    const botLidNum = botLid.split('@')[0].split(':')[0];
    return participants.some((p) => {
        if (p.admin !== 'admin' && p.admin !== 'superadmin')
            return false;
        const pId = (p.id || '');
        const pLid = (p.lid || '');
        const pNum = pId.split('@')[0].split(':')[0];
        const pLidNum = pLid.split('@')[0].split(':')[0];
        const pPhone = p.phoneNumber ? p.phoneNumber.split('@')[0] : '';
        return (pId === botId ||
            pId === botLid ||
            pLid === botLid ||
            pLid === botId ||
            pNum === botNum ||
            pLidNum === botLidNum ||
            pNum === botLidNum ||
            pLidNum === botNum ||
            pPhone === botNum);
    });
}
const DEFAULT_GROUP_CONFIG = {
    enabled: false,
    maxMessages: 5,
    windowSeconds: 5,
    action: 'warn',
    warnCount: 3
};
async function loadConfig() {
    try {
        if (HAS_DB) {
            const data = await store.getSetting('global', 'antispam');
            return data || { groups: {} };
        }
        else {
            if (!fs.existsSync(configPath)) {
                const dataDir = path.dirname(configPath);
                if (!fs.existsSync(dataDir))
                    fs.mkdirSync(dataDir, { recursive: true });
                fs.writeFileSync(configPath, JSON.stringify({ groups: {} }, null, 2));
            }
            return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        }
    }
    catch {
        return { groups: {} };
    }
}
async function saveConfig(config) {
    if (HAS_DB) {
        await store.saveSetting('global', 'antispam', config);
    }
    else {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    }
}
// ── Named export hooked into messageHandler.ts ────────────────────────────
export async function handleAntiSpam(sock, chatId, message, senderId, senderIsOwnerOrSudo) {
    try {
        if (message.key.fromMe || senderIsOwnerOrSudo)
            return false;
        const config = await loadConfig();
        const groupConfig = config.groups[chatId];
        if (!groupConfig || !groupConfig.enabled)
            return false;
        // Use TTL-cached participants — no live API call unless cache expired
        const participants = await getParticipants(sock, chatId);
        const isBotAdmin = getBotAdminStatus(participants, sock);
        const isSenderAdmin = isParticipantAdmin(participants, senderId);
        // Never spam-check group admins
        if (isSenderAdmin)
            return false;
        const now = Date.now();
        const windowMs = groupConfig.windowSeconds * 1000;
        if (!tracker.has(chatId))
            tracker.set(chatId, new Map());
        const groupTracker = tracker.get(chatId);
        if (!groupTracker.has(senderId)) {
            groupTracker.set(senderId, { count: 1, firstMessageالوقت: now, warns: 0 });
            return false;
        }
        const userData = groupTracker.get(senderId);
        // Reset window if expired
        if (now - userData.firstMessageTime > windowMs) {
            userData.count = 1;
            userData.firstMessageTime = now;
            return false;
        }
        userData.count++;
        if (userData.count <= groupConfig.maxMessages)
            return false;
        // ── SPAM DETECTED ──────────────────────────────────────────────────
        // Reset counter immediately so we don't fire multiple times
        userData.count = 0;
        userData.firstMessageTime = now;
        if (groupConfig.action === 'warn') {
            userData.warns++;
            const warnsLeft = groupConfig.warnCount - userData.warns;
            try {
                if (warnsLeft > 0) {
                    await sock.sendMessage(chatId, {
                        text: `⚠️ @${senderId.split('@')[0]} *توقف عن إرسال السبام!*\n_تحذيرing ${userData.warns}/${groupConfig.warnCount}. ${warnsLeft} more warn(s) before removal._`,
                        منشن: [senderId],
                        ...channelInfo
                    });
                }
                else {
                    userData.warns = 0;
                    if (!isBotAdmin) {
                        await sock.sendMessage(chatId, {
                            text: `⚠️ @${senderId.split('@')[0]} وصل للحد الأقصى من التحذيرات لكن البوت يحتاج صلاحية مشرف لطرده.`,
                            منشن: [senderId],
                            ...channelInfo
                        });
                    }
                    else {
                        await sock.sendMessage(chatId, {
                            text: `🚫 @${senderId.split('@')[0]} has been *removed* for repeated spamming.`,
                            منشن: [senderId],
                            ...channelInfo
                        });
                        await new Promise(r => setTimeout(r, 500));
                        await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                    }
                }
            }
            catch (sendErr) {
                console.error('[ANTISPAM] Failed to send warning:', sendErr.message);
            }
            return true;
        }
        if (groupConfig.action === 'kick') {
            if (!isBotAdmin) {
                await sock.sendMessage(chatId, {
                    text: `⚠️ سبام من @${senderId.split('@')[0]} — البوت يحتاج صلاحية مشرف للطرد.`,
                    منشن: [senderId],
                    ...channelInfo
                });
            }
            else {
                await sock.sendMessage(chatId, {
                    text: `🚫 @${senderId.split('@')[0]} تم طرده بسبب السبام.`,
                    منشن: [senderId],
                    ...channelInfo
                });
                await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
            }
            return true;
        }
        if (groupConfig.action === 'mute') {
            if (!isBotAdmin) {
                await sock.sendMessage(chatId, {
                    text: `⚠️ سبام من @${senderId.split('@')[0]} — البوت يحتاج صلاحية مشرف للكتم.`,
                    منشن: [senderId],
                    ...channelInfo
                });
            }
            else {
                await sock.sendMessage(chatId, {
                    text: `🔇 @${senderId.split('@')[0]} تم طرده بسبب السبام.`,
                    منشن: [senderId],
                    ...channelInfo
                });
                await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
            }
            return true;
        }
        return false;
    }
    catch (e) {
        console.error('[ANTISPAM] Error:', e.message);
        return false;
    }
}
// Invalidate cache when group participants change (call this on group-participants.update)
export function invalidateGroupCache(chatId) {
    metaCache.delete(chatId);
    tracker.delete(chatId);
}
export { loadConfig, saveConfig, DEFAULT_GROUP_CONFIG };
export default {
    command: 'antispam',
    aliases: ['floodprotect', 'antiflood'],
    category: 'admin',
    description: 'إعداد حماية الجروب من الإغراق والرسائل المزعجة',
    usage: '.antispam on/off | .antispam set <msgs> <seconds> | .antispam action <warn/kick/mute> | .antispam warns <n>',
    groupOnly: true,
    adminOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const channelInfo = context.channelInfo || {};
        const isBotAdmin = context.isBotAdmin || false;
        const config = await loadConfig();
        if (!config.groups[chatId])
            config.groups[chatId] = { ...DEFAULT_GROUP_CONFIG };
        const groupConfig = config.groups[chatId];
        const action = args[0]?.toLowerCase();
        if (!action || action === 'status') {
            return await sock.sendMessage(chatId, {
                text: `*🛡️ حالة منع السبام*\n\n` +
                    `*Status:* ${groupConfig.enabled ? '✅ Enabled' : '❌ Disabled'}\n` +
                    `*الحد:* ${groupConfig.maxMessages} رسالة خلال ${groupConfig.windowSeconds}s\n` +
                    `*الإجراء:* ${groupConfig.action.toUpperCase()}\n` +
                    `*تحذير limit:* ${groupConfig.warnCount} warns قبل الطرد\n` +
                    `*البوت مشرف:* ${isBotAdmin ? '✅ نعم' : '❌ لا (مطلوب للطرد/الكتم)'}\n\n` +
                    `*الأوامر:*\n` +
                    `• \`.antispam on/off\`\n` +
                    `• \`.antispam set 5 10\` — 5 msgs in 10s\n` +
                    `• \`.antispam action warn/kick/mute\`\n` +
                    `• \`.antispam warns 3\` — warns قبل الطرد`,
                ...channelInfo
            }, { quoted: message });
        }
        if (action === 'on' || action === 'enable') {
            if (groupConfig.enabled)
                return await sock.sendMessage(chatId, { text: '⚠️ منع السبام مفعل بالفعل.', ...channelInfo }, { quoted: message });
            if (!isBotAdmin && groupConfig.action !== 'warn') {
                await sock.sendMessage(chatId, { text: `⚠️ البوت ليس مشرفًا — الطرد/الكتم لن يعمل حتى يصبح البوت مشرفًا.`, ...channelInfo }, { quoted: message });
            }
            groupConfig.enabled = true;
            await saveConfig(config);
            return await sock.sendMessage(chatId, {
                text: `✅ *تم تشغيل منع السبام!*\nالحد: ${groupConfig.maxMessages} msgs in ${groupConfig.windowSeconds}s | الإجراء: ${groupConfig.action.toUpperCase()}`,
                ...channelInfo
            }, { quoted: message });
        }
        if (action === 'off' || action === 'disable') {
            if (!groupConfig.enabled)
                return await sock.sendMessage(chatId, { text: '⚠️ منع السبام متوقف بالفعل.', ...channelInfo }, { quoted: message });
            groupConfig.enabled = false;
            await saveConfig(config);
            return await sock.sendMessage(chatId, { text: '❌ *تم إيقاف منع السبام.*', ...channelInfo }, { quoted: message });
        }
        if (action === 'set') {
            const maxMsgs = parseInt(args[1], 10);
            const windowSec = parseInt(args[2], 10);
            if (isNaN(maxMsgs) || isNaN(windowSec) || maxMsgs < 2 || windowSec < 1) {
                return await sock.sendMessage(chatId, { text: '❌ Usage: `.antispam set <messages> <seconds>`\nExample: `.antispam set 5 10`', ...channelInfo }, { quoted: message });
            }
            groupConfig.maxMessages = maxMsgs;
            groupConfig.windowSeconds = windowSec;
            await saveConfig(config);
            return await sock.sendMessage(chatId, { text: `✅ الحد: *${maxMsgs} msgs* in *${windowSec}s*`, ...channelInfo }, { quoted: message });
        }
        if (action === 'action') {
            const newAction = args[1]?.toLowerCase();
            if (!['warn', 'kick', 'mute'].includes(newAction)) {
                return await sock.sendMessage(chatId, { text: '❌ Choose: `warn`, `kick`, or `mute`', ...channelInfo }, { quoted: message });
            }
            if (newAction !== 'warn' && !isBotAdmin) {
                await sock.sendMessage(chatId, { text: `⚠️ Action set to *${newAction.toUpperCase()}* but bot needs admin rights to execute it.`, ...channelInfo }, { quoted: message });
            }
            groupConfig.action = newAction;
            await saveConfig(config);
            return await sock.sendMessage(chatId, { text: `✅ الإجراء: *${newAction.toUpperCase()}*`, ...channelInfo }, { quoted: message });
        }
        if (action === 'warns') {
            const count = parseInt(args[1], 10);
            if (isNaN(count) || count < 1)
                return await sock.sendMessage(chatId, { text: '❌ Example: `.antispam warns 3`', ...channelInfo }, { quoted: message });
            groupConfig.warnCount = count;
            await saveConfig(config);
            return await sock.sendMessage(chatId, { text: `✅ تحذير limit: *${count}* before action.`, ...channelInfo }, { quoted: message });
        }
        return await sock.sendMessage(chatId, { text: '❌ اختيار غير معروف. Use `.antispam status`', ...channelInfo }, { quoted: message });
    },
    handleAntiSpam,
    invalidateGroupCache
};
