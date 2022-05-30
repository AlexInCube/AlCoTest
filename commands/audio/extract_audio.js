const { Permissions } = require('discord.js')
const { AudioPlayer } = require('../../main')

module.exports.help = {
  name: 'extract_audio',
  group: 'audio',
  arguments: '(Ссылка на Youtube видео или Spotify трек)',
  description: 'Достаёт аудио дорожку из видео и отправляет её в чат. Если трек из Spotify, то он ищется на Youtube.',
  bot_permissions: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.MANAGE_MESSAGES, Permissions.FLAGS.ATTACH_FILES]
}

module.exports.run = async (client, message, args) => {
  await AudioPlayer.extractAudioToMessage(message, args)
}
