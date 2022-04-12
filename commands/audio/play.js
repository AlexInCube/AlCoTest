require('fs')
const { distube } = require('../../main')
const { Permissions } = require('discord.js')
const { isValidURL } = require('../../custom_modules/tools')
const { CheckUserInVoice } = require('../../custom_modules/Audioplayer/Audioplayer')

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
  if (await CheckUserInVoice(client, queryMessage)) return

  let userSearch = ''// Эта переменная становится запросом который дал пользователь, ссылка (трек или плейлист), прикреплённый файл или любая белеберда будет работать как поиск

  if (queryMessage.attachments.size > 0) { // Если к сообщению прикреплены аудиофайлы
    userSearch = queryMessage.attachments.first().url// Берём ссылку из Discord CDN на файл
    if (!userSearch.endsWith('.mp3') && !userSearch.endsWith('.wav') && !userSearch.endsWith('.ogg')) {
      await queryMessage.reply('Это не аудиофайл, это чёрт пойми что!'); return
    }
  } else { // Если файлов всё таки нет, то проверяем правильность ввода ссылки или белеберды
    if (args[0] === undefined) { await queryMessage.reply('А что ты слушать хочешь, то а? Укажи хоть что-нибудь.'); return }// Если пользователь ничего не предоставил
    if (args[0] === '') { await queryMessage.reply('Ты как-то неправильно ввёл название, попробуй ещё раз.'); return }// Защита от случайного пробела после команды
    if (isValidURL(args[0])) {
      userSearch = args[0]
    } else {
      args.forEach((item) => { // Складываем в кучу все аргументы пользователя, чтобы удобнее было составлять запрос на поиск песен
        userSearch += `${item} `
      })
    }
  }

  const options = {
    textChannel: queryMessage.channel,
    message: queryMessage,
    member: queryMessage.member
  }
  await distube.play(queryMessage.member.voice.channel, userSearch, options)
}
