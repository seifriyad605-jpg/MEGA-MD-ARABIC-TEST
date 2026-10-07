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
import axios from 'axios';
export default {
    command: 'alamy',
    aliases: ['alamydl', 'alamydownload'],
    category: 'download',
    description: 'تحميل صورة أو فيديو من رابط Alamy',
    usage: '.alamy <Alamy URL>',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const url = args?.[0]?.trim();
        if (!url) {
            return await sock.sendMessage(chatId, { text: '❌ من فضلك اكتب رابط Alamy.\nExample: .alamy https://www.alamy.com/video/beautiful-lake...' }, { quoted: message });
        }
        try {
            const apiUrl = `https://discardapi.dpdns.org/api/dl/alamy?apikey=guru&url=${encodeURIComponent(url)}`;
            const { data } = await axios.get(apiUrl, { timeout: 10000 });
            if (!data?.status || !data.result?.length) {
                return await sock.sendMessage(chatId, { text: '❌ فشل جلب الوسائط من رابط Alamy المرسل.' }, { quoted: message });
            }
            const isValidUrl = (u) => u && u.startsWith('http');
            let sent = false;
            for (const item of data.result) {
                if (isValidUrl(item.video)) {
                    await sock.sendMessage(chatId, { video: { url: item.video }, caption: '🎬 *فيديو Alamy*' }, { quoted: message });
                    sent = true;
                }
                if (isValidUrl(item.image)) {
                    await sock.sendMessage(chatId, { image: { url: item.image }, caption: '🖼️ *صورة Alamy*' }, { quoted: message });
                    sent = true;
                }
            }
            if (!sent) {
                await sock.sendMessage(chatId, { text: '❌ لم يتم العثور على وسائط صالحة في رابط Alamy.' }, { quoted: message });
            }
        }
        catch (error) {
            console.error('Alamy download plugin error:', error);
            if (error.code === 'ECONNABORTED') {
                await sock.sendMessage(chatId, { text: '❌ انتهت مهلة الطلب. قد تكون الخدمة بطيئة أو غير متاحة.' }, { quoted: message });
            }
            else {
                await sock.sendMessage(chatId, { text: '❌ فشل تحميل الوسائط من رابط Alamy.' }, { quoted: message });
            }
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
