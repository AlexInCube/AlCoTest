const { Permissions } = require('discord.js')
const { AudioPlayer } = require('../../main')
module.exports.help = {
  name: 'remove',
  group: 'audio',
  arguments: '(позиция в очереди)',
  description: 'Удалить песню из очереди по указанной позиции. Чтобы узнать позицию песни, нажмите "Показать очередь" в проигрывателе',
  bot_permissions: [Permissions.FLAGS.SEND_MESSAGES]
}

module.exports.run = async (client, message, args) => {
  if (!await AudioPlayer.checkUserInVoice(message.member, message)) return
  await AudioPlayer.deleteSongFromQueue(message.guild, parseInt(args[0]) - 1, message.author.username)
}
