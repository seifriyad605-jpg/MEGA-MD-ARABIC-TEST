import { getBin } from '../lib/compile.js';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
export default {
    command: 'cipher',
    aliases: ['encrypt', 'decrypt', 'encode', 'crypt'],
    category: 'utility',
    description: 'تشفير أو فك تشفير النص باستخدام Caesar أو Vigenere أو XOR',
    usage: '.cipher <type> <encode|decode> <key> <text>',
    async handler(sock, message, args, context) {
        const { chatId, channelInfo } = context;
        if (args.length < 4) {
            return await sock.sendMessage(chatId, {
                text: `🔐 *تشفير النص*\n\n` +
                    `*Usage:* \`.cipher <type> <encode|decode> <key> <text>\`\n\n` +
                    `*أنواع التشفير:*\n\n` +
                    `*caesar* — shift letters by a number (key = number)\n` +
                    `• \`.cipher caesar encode 13 Hello World\`\n` +
                    `• \`.cipher caesar decode 13 Uryyb Jbeyq\`\n\n` +
                    `*vigenere* — polyalphabetic cipher (key = word)\n` +
                    `• \`.cipher vigenere encode SECRET Hello World\`\n` +
                    `• \`.cipher vigenere decode SECRET Zincs Pgvnu\`\n\n` +
                    `*xor* — XOR byte cipher, output is hex (key = any text)\n` +
                    `• \`.cipher xor encode mykey Hello\`\n` +
                    `• \`.cipher xor decode mykey 25090a0e06\``,
                ...channelInfo
            }, { quoted: message });
        }
        const cipherType = args[0].toLowerCase();
        const mode = args[1].toLowerCase();
        const key = args[2];
        const text = args.slice(3).join(' ').trim();
        if (!['caesar', 'vigenere', 'xor'].includes(cipherType)) {
            return await sock.sendMessage(chatId, {
                text: `❌ نوع التشفير غير معروف: *${cipherType}*\nUse: \`caesar\`, \`vigenere\`, or \`xor\``,
                ...channelInfo
            }, { quoted: message });
        }
        if (!['encode', 'decode', 'encrypt', 'decrypt'].includes(mode)) {
            return await sock.sendMessage(chatId, {
                text: `❌ الوضع غير معروف: *${mode}*\nUse: \`encode\` or \`decode\``,
                ...channelInfo
            }, { quoted: message });
        }
        if (!text) {
            return await sock.sendMessage(chatId, {
                text: `❌ لم يتم إدخال نص.`,
                ...channelInfo
            }, { quoted: message });
        }
        if (cipherType === 'caesar' && isNaN(parseInt(key, 10))) {
            return await sock.sendMessage(chatId, {
                text: `❌ مفتاح Caesar يجب أن يكون رقمًا (e.g. 13)`,
                ...channelInfo
            }, { quoted: message });
        }
        try {
            const bin = getBin('cipher');
            const safeText = text.replace(/"/g, '\\"');
            const safeKey = key.replace(/"/g, '\\"');
            const { stdout, stderr } = await execAsync(`"${bin}" ${cipherType} ${mode} "${safeKey}" "${safeText}"`, { timeout: 10000 });
            if (stderr && !stdout) {
                return await sock.sendMessage(chatId, {
                    text: `❌ ${stderr.trim()}`,
                    ...channelInfo
                }, { quoted: message });
            }
            const result = stdout.trim();
            const cipherNames = {
                caesar: 'Caesar', vigenere: 'Vigenère', xor: 'XOR'
            };
            const modeLabel = (mode === 'encode' || mode === 'encrypt') ? '🔒 تم التشفير' : '🔓 تم فك التشفير';
            await sock.sendMessage(chatId, {
                text: `🔐 *${cipherNames[cipherType]} Cipher*\n\n` +
                    `📥 *المدخل:* \`${text}\`\n` +
                    `🔑 *Key:* \`${key}\`\n` +
                    `${modeLabel}: \`${result}\``,
                ...channelInfo
            }, { quoted: message });
        }
        catch (error) {
            await sock.sendMessage(chatId, {
                text: `❌ فشل: ${error.message}`,
                ...channelInfo
            }, { quoted: message });
        }
    }
};
