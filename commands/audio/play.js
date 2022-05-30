require('fs')
const { AudioPlayer } = require('../../main')
const { Permissions } = require('discord.js')

module.exports.help = {
  name: 'play',
  group: 'audio',
  arguments: '(запрос)',
  description:
        'Проигрывает музыку указанную пользователем. \n' +
        'Принимаются:\n Ссылка с Youtube/Spotify/Soundcloud\n1 прикреплённый аудиофайл (mp3, wav или ogg)\nЛюбая писанина, будет запросом на поиск',
  bot_permissions: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.CONNECT, Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SPEAK, Permissions.FLAGS.MANAGE_MESSAGES, Permissions.FLAGS.ATTACH_FILES]
}

module.exports.run = async (client, queryMessage, args) => {
  await AudioPlayer.play(queryMessage, args)
}
