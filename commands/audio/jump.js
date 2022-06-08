const { AudioPlayer } = require('../../main')
const { Permissions } = require('discord.js')
module.exports.help = {
  name: 'jump',
  group: 'audio',
  arguments: '(позиция в очереди)',
  description: 'Пропускает все песни до указанной позиции. Чтобы узнать позицию песни, нажмите "Показать очередь" в проигрывателе',
  bot_permissions: [Permissions.FLAGS.SEND_MESSAGES]
}

module.exports.run = async (client, message, args) => {
  if (!await AudioPlayer.checkUserInVoice(message.member, message)) return
  let pos = parseInt(args[0])
  if (pos > 0) { pos-- }
  await AudioPlayer.jump(message.guild, pos, message, message.author.username)
}
