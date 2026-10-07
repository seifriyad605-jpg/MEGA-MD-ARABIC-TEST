import config from '../config.js';
import commandHandler from '../lib/commandHandler.js';

export default {
  command: 'قائمة',
  aliases: ['الاوامر', 'الأوامر', 'اوامر', 'القائمة', 'مساعدة', 'مساعده'],
  category: 'عام',
  description: 'عرض قائمة أوامر البوت بالعربية',
  usage: 'قائمة',
  isPrefixless: true,
  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const channelInfo = context.channelInfo || {};
    if (args.length) {
      const wanted = args.join(' ').toLowerCase();
      let cmd = commandHandler.commands.get(wanted);
      if (!cmd && commandHandler.aliases.has(wanted)) cmd = commandHandler.commands.get(commandHandler.aliases.get(wanted));
      if (!cmd) return sock.sendMessage(chatId, { text: '❌ الأمر "' + args.join(' ') + '" غير موجود.\n\nاكتب قائمة لعرض كل الأوامر.', ...channelInfo }, { quoted: message });
      const prefix = config.prefixes?.[0] || '.';
      return sock.sendMessage(chatId, { text:
        '╭━━━〔 معلومات الأمر 〕━━━⬣\n' +
        '┃ ⚡ الأمر: ' + prefix + cmd.command + '\n' +
        '┃ 📝 الوصف: ' + (cmd.description || 'لا يوجد وصف') + '\n' +
        '┃ 📖 الاستخدام: ' + (cmd.usage || prefix + cmd.command) + '\n' +
        '┃ 🏷️ القسم: ' + (cmd.category || 'عام') + '\n' +
        '┃ 🔖 البدائل: ' + (cmd.aliases?.length ? cmd.aliases.join(' ، ') : 'لا يوجد') + '\n' +
        '╰━━━━━━━━━━━━━━━━━━⬣', ...channelInfo }, { quoted: message });
    }
    const lines = ['╭━━━〔 🤖 قائمة أوامر MEGA-MD 〕━━━⬣', '┃ البوت: ' + (config.botName || 'MEGA-MD'), '┃ عدد الأوامر: ' + commandHandler.commands.size, '┃'];
    for (const [category, commands] of commandHandler.categories) {
      lines.push('┃ 🔹 ' + (config.categoryNames?.[category] || (commands[0] && commandHandler.commands.get(String(commands[0]).toLowerCase())?.arabicCategory) || category));
      for (const command of commands) {
        const cmd = commandHandler.commands.get(String(command).toLowerCase());
        lines.push('┃   • ' + (cmd?.arabicName || command));
      }
    }
    lines.push('╰━━━━━━━━━━━━━━━━━━━━⬣');
    await sock.sendMessage(chatId, { text: lines.join('\n'), ...channelInfo }, { quoted: message });
  }
};
