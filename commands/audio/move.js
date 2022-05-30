const { AudioPlayer } = require('../../main')
const { Permissions } = require('discord.js')
module.exports.help = {
  name: 'move',
  group: 'audio',
  arguments: '(позиция в очереди)',
  description: 'Пропускает все песни до указанной позиции. Чтобы узнать позицию песни, нажмите "Показать очередь" в проигрывателе',
  bot_permissions: [Permissions.FLAGS.SEND_MESSAGES]
}

module.exports.run = async (client, message, args) => {
  await AudioPlayer.jump(message, parseInt(args[0]))
}
