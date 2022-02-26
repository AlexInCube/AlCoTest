const { Permissions } = require('discord.js')
module.exports.help = {
  name: 'alcotest',
  group: 'fun',
  description: 'Пишет процент пива в твоей крови',
  bot_permissions: [Permissions.FLAGS.SEND_MESSAGES]
}

module.exports.run = async (client, message) => {
  message.reply(`🍻 Вы состоите из пива на ${Math.round(Math.random() * 100)}% 🍻 `)
}
