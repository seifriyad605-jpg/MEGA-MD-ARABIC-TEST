import store from '../lib/lightweight_store.js';
import fs from 'fs';
const MONGO_URL = process.env.MONGO_URL;
const POSTGRES_URL = process.env.POSTGRES_URL;
const MYSQL_URL = process.env.MYSQL_URL;
const SQLITE_URL = process.env.DB_URL;
const HAS_DB = !!(MONGO_URL || POSTGRES_URL || MYSQL_URL || SQLITE_URL);
const ANTICALL_PATH = './data/anticall.json';
async function readState() {
    try {
        if (HAS_DB) {
            const settings = await store.getSetting('global', 'anticall');
            return settings || { enabled: false };
        }
        else {
            if (!fs.existsSync(ANTICALL_PATH))
                return { enabled: false };
            const raw = fs.readFileSync(ANTICALL_PATH, 'utf8');
            const data = JSON.parse(raw || '{}');
            return { enabled: !!data.enabled };
        }
    }
    catch {
        return { enabled: false };
    }
}
async function writeState(enabled) {
    try {
        if (HAS_DB) {
            await store.saveSetting('global', 'anticall', { enabled: !!enabled });
        }
        else {
            if (!fs.existsSync('./data'))
                fs.mkdirSync('./data', { recursive: true });
            fs.writeFileSync(ANTICALL_PATH, JSON.stringify({ enabled: !!enabled }, null, 2));
        }
    }
    catch (e) {
        console.error('Error writing anticall state:', e);
    }
}
export default {
    command: 'anticall',
    aliases: ['acall', 'callblock'],
    category: 'owner',
    description: 'تشغيل أو إيقاف الحظر التلقائي للمكالمات الواردة',
    usage: '.anticall <on|off|status>',
    ownerOnly: true,
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const state = await readState();
        const sub = args.join(' ').trim().toLowerCase();
        if (!sub || !['on', 'off', 'status'].includes(sub)) {
            return await sock.sendMessage(chatId, {
                text: '*إعدادات منع المكالمات*\n\n' +
                    '📵 الحظر التلقائي للمكالمات الواردة\n\n' +
                    '*Usage:*\n' +
                    '• `.anticall on` - Enable\n' +
                    '• `.anticall off` - Disable\n' +
                    '• `.anticall status` - Current status\n\n' +
                    `*الحالة الحالية:* ${state.enabled ? '✅ مفعل' : '❌ متوقف'}\n` +
                    `*التخزين:* ${HAS_DB ? 'قاعدة البيانات' : 'نظام الملفات'}`
            }, { quoted: message });
        }
        if (sub === 'status') {
            return await sock.sendMessage(chatId, {
                text: `📵 *حالة منع المكالمات*\n\n` +
                    `الحالة: ${state.enabled ? '✅ *مفعل*' : '❌ *متوقف*'}\n` +
                    `التخزين: ${HAS_DB ? 'قاعدة البيانات' : 'نظام الملفات'}\n\n` +
                    `${state.enabled ? 'سيتم رفض وحظر جميع المكالمات الواردة.' : 'المكالمات الواردة مسموحة.'}`
            }, { quoted: message });
        }
        const enable = sub === 'on';
        await writeState(enable);
        await sock.sendMessage(chatId, {
            text: `📵 *Anticall ${enable ? 'مفعل' : 'متوقف'}*\n\n` +
                `${enable ? '✅ سيتم الآن رفض وحظر المكالمات الواردة تلقائيًا.' : '❌ المكالمات الواردة مسموحة الآن.'}`
        }, { quoted: message });
    },
    readState,
    writeState
};
