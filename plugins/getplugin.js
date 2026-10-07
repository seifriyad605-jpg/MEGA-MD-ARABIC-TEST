/*****************************************************************************
 *                                                                           *
 *                     Developed By Qasim Ali                                *
 *                                                                           *
 *  🌐  GitHub   : https://github.com/GlobalTechInfo                         *
 *  ▶️  YouTube  : https://youtube.com/@GlobalTechInfo                       *
 *  💬  WhatsApp : https://whatsapp.com/channel/0029VagJIAr3bbVBCpEkAM07     *
 *                                                                           *
 *    © 2026 GlobalTechInfo. All rights reserved.                            *
 *                                                                           *
 *    Description: This file is part of the MEGA-MD Project.                 *
 *                 Unauthorized copying or distribution is prohibited.       *
 *                                                                           *
 *****************************************************************************/
import fs from 'fs';
import path from 'path';
export default {
    command: 'inspect',
    aliases: ['cat', 'readcode', 'getplugin'],
    category: 'owner',
    description: 'قراءة الكود المصدري لإضافة معينة',
    usage: '.inspect [plugin_name]',
    ownerOnly: true,
    async handler(sock, message, args, _context) {
        const chatId = message.key.remoteJid;
        const pluginName = args[0];
        if (!pluginName) {
            return await sock.sendMessage(chatId, { text: 'أي إضافة تريد فحصها؟\n\n*Examples:*\n- .inspect ping\n- .inspect ping.ts\n- .inspect ping.js' }, { quoted: message });
        }
        try {
            const base = pluginName.replace(/\.(ts|js)$/, '');
            let filePath;
            let fileName;
            if (pluginName.endsWith('.js')) {
                filePath = path.join(process.cwd(), 'plugins', `${base }.js`);
                fileName = `${base }.js`;
            }
            else {
                filePath = path.join(process.cwd(), 'plugins', `${base }.ts`);
                fileName = `${base }.ts`;
                if (!fs.existsSync(filePath)) {
                    filePath = path.join(process.cwd(), 'plugins', `${base }.js`);
                    fileName = `${base }.js`;
                }
            }
            if (!fs.existsSync(filePath)) {
                return await sock.sendMessage(chatId, { text: `❌ الإضافة "${base}" غير موجودة.` }, { quoted: message });
            }
            const code = fs.readFileSync(filePath, 'utf8');
            const formattedCode = `💻 *الكود المصدري: ${fileName}*\n\n\`\`\`javascript\n${code}\n\`\`\``;
            if (formattedCode.length > 4000) {
                await sock.sendMessage(chatId, {
                    document: Buffer.from(code),
                    fileName,
                    mimetype: 'text/javascript',
                    caption: `📄 كود *${fileName}* (الملف كبير جدًا على رسالة نصية)`
                }, { quoted: message });
            }
            else {
                await sock.sendMessage(chatId, { text: formattedCode }, { quoted: message });
            }
        }
        catch (error) {
            console.error('Inspect Error:', error);
            await sock.sendMessage(chatId, { text: '❌ فشل قراءة ملف الإضافة.' });
        }
    }
};
/*****************************************************************************
 *                                                                           *
 *                     Developed By Qasim Ali                                *
 *                                                                           *
 *  🌐  GitHub   : https://github.com/GlobalTechInfo                         *
 *  ▶️  YouTube  : https://youtube.com/@GlobalTechInfo                       *
 *  💬  WhatsApp : https://whatsapp.com/channel/0029VagJIAr3bbVBCpEkAM07     *
 *                                                                           *
 *    © 2026 GlobalTechInfo. All rights reserved.                            *
 *                                                                           *
 *    Description: This file is part of the MEGA-MD Project.                 *
 *                 Unauthorized copying or distribution is prohibited.       *
 *                                                                           *
 *****************************************************************************/
