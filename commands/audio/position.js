const { Permissions } = require('discord.js')
const { AudioPlayer } = require('../../main')
module.exports.help = {
  name: 'position',
  group: 'audio',
  arguments: '(время)',
  description: 'Меняет позицию с которой должна проигрываться песня. К примеру 3h 20m 15s',
  bot_permissions: [Permissions.FLAGS.SEND_MESSAGES]
}

module.exports.run = async (client, message, args) => {
  if (!await AudioPlayer.checkUserInVoice(message.member, message)) return
  await AudioPlayer.position(message.member, message, args)
}
