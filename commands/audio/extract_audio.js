const { Permissions } = require('discord.js')

const { getData } = require('spotify-url-info')
const { distube } = require('../../main')
const { downloadSong } = require('../../custom_modules/Audioplayer/Audioplayer')

module.exports.help = {
  name: 'extract_audio',
  group: 'audio',
  arguments: '(Ссылка на Youtube видео или Spotify трек)',
  description: 'Достаёт аудио дорожку из видео и отправляет её в чат. Если трек из Spotify, то он ищется на Youtube.',
  bot_permissions: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.MANAGE_MESSAGES, Permissions.FLAGS.ATTACH_FILES]
}

module.exports.run = async (client, message, args) => {
  const url = args[0]
  if (!url) { message.reply('А ссылку указать? Мне что самому надо придумать что тебе надо?') }
  let songData
  let searchQuery = ''

  const botMessage = await message.channel.send({ content: `${message.author} ожидайте...` })

  if (url.startsWith('https://open.spotify.com')) {
    await getData(url).then(data => {
      searchQuery = data.name
    })
  } else {
    args.forEach((item) => {
      searchQuery += `${item} `
    })
  }

  try {
    songData = await distube.search(searchQuery, { limit: 1, type: 'video' }).then(function (result) {
      return result[0]
    })
  } catch (e) {
    await botMessage.edit({ content: `${message.author} я не смог ничего найти` })
    return
  }

  await downloadSong(songData, message, message.author.username)
}
