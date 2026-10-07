// Safe math evaluator using pure Node.js - no Python needed
function safeMath(expr) {
    // Replace math function names to JS equivalents
    const sanitized = expr
        .replace(/\^/g, '**')
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/cbrt\(/g, 'Math.cbrt(')
        .replace(/abs\(/g, 'Math.abs(')
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/log\(/g, 'Math.log10(')
        .replace(/ln\(/g, 'Math.log(')
        .replace(/floor\(/g, 'Math.floor(')
        .replace(/ceil\(/g, 'Math.ceil(')
        .replace(/round\(/g, 'Math.round(')
        .replace(/pow\(/g, 'Math.pow(')
        .replace(/min\(/g, 'Math.min(')
        .replace(/max\(/g, 'Math.max(')
        .replace(/\bpi\b/gi, String(Math.PI))
        .replace(/\be\b/g, String(Math.E));
    // Block anything dangerous
    const blocked = /[a-zA-Z_$](?!ath\.)(?![0-9])/;
    const mathFunctions = /Math\.[a-z]+/g;
    const cleaned = sanitized.replace(mathFunctions, '');
    if (blocked.test(cleaned)) {
        throw new Error('التعبير غير صحيح — مسموح فقط بعوامل ودوال الرياضيات');
    }
    // Only allow safe characters
    if (!/^[\d\s+\-*/%.(),Math.a-zA-Z]+$/.test(sanitized)) {
        throw new Error('يوجد رموز غير مسموحة في التعبير');
    }
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${sanitized})`)();
    if (typeof result !== 'number')
        throw new Error('النتيجة ليست رقمًا');
    if (!isFinite(result))
        throw new Error('النتيجة غير محدودة أو غير صالحة');
    return Number.isInteger(result) ? String(result) : result.toPrecision(10).replace(/\.?0+$/, '');
}
export default {
    command: 'calc',
    aliases: ['math', 'calculate', 'solve'],
    category: 'utility',
    description: 'آلة حاسبة متقدمة',
    usage: '.calc <expression>',
    async handler(sock, message, args, context) {
        const { chatId, channelInfo } = context;
        const expr = args.join(' ').trim();
        if (!expr) {
            return await sock.sendMessage(chatId, {
                text: `🧮 *الحاسبة*\n\n` +
                    `*Usage:* \`.calc <expression>\`\n\n` +
                    `*أمثلة:*\n` +
                    `• \`.calc 2 ** 10\` → 1024\n` +
                    `• \`.calc sqrt(144)\` → 12\n` +
                    `• \`.calc sin(pi / 2)\` → 1\n` +
                    `• \`.calc log(1000)\` → 3\n` +
                    `• \`.calc (3 + 4) * 2\` → 14\n` +
                    `• \`.calc pow(2, 8)\` → 256\n\n` +
                    `*الدوال:* sqrt, cbrt, abs, sin, cos, tan, log, ln, floor, ceil, round, pow, min, max\n` +
                    `*الثوابت:* pi, e`,
                ...channelInfo
            }, { quoted: message });
        }
        try {
            const result = safeMath(expr);
            await sock.sendMessage(chatId, {
                text: `🧮 *الحاسبة*\n\n📥 *المدخل:* \`${expr}\`\n📤 *النتيجة:* \`${result}\``,
                ...channelInfo
            }, { quoted: message });
        }
        catch (error) {
            await sock.sendMessage(chatId, {
                text: `❌ *خطأ:* ${error.message}`,
                ...channelInfo
            }, { quoted: message });
        }
    }
};
