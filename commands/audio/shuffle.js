const { Permissions } = require('discord.js')
const { AudioPlayer } = require('../../main')
module.exports.help = {
  name: 'shuffle',
  group: 'audio',
  arguments: '',
  description: 'Перемешивает все песни в очереди',
  bot_permissions: [Permissions.FLAGS.SEND_MESSAGES]
}

module.exports.run = async (client, message) => {
  await AudioPlayer.shuffle(message)
}
