const { Permissions } = require('discord.js')
const { AudioPlayer } = require('../../main')
module.exports.help = {
  name: 'playing',
  group: 'audio',
  arguments: '',
  description: 'Показывает текущее время проигрывания песни',
  bot_permissions: [Permissions.FLAGS.SEND_MESSAGES]
}

module.exports.run = async (client, message) => {
  await AudioPlayer.getCurrentPlaying(message)
}
