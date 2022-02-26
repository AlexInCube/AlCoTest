const ytdl = require('ytdl-core')
const fs = require('fs')
const { Permissions } = require('discord.js')

const { getData } = require('spotify-url-info')
const { generateRandomCharacters } = require('../../custom_modules/tools')
const { distube } = require('../../main')

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
  const filePath = fs.createWriteStream(`${generateRandomCharacters(15)}.mp3`)
  let songData
  let searchQuery

  const botMessage = await message.channel.send({ content: `${message.author} ожидайте...` })

  if (url.startsWith('https://open.spotify.com')) {
    await getData(url).then(data => {
      searchQuery = data.name
    })
  } else {
    searchQuery = url
  }

  try {
    songData = await distube.search(searchQuery, { limit: 1, type: 'video' }).then(function (result) {
      return result[0]
    })
  } catch (e) {
    await botMessage.edit({ content: `${message.author} я не смог ничего найти` })
    return
  }

  const fileName = `${songData.name}.mp3`
  ytdl(songData.url, { filter: 'audioonly', format: 'mp3' }).on('end', async () => {
    await fs.rename(filePath.path, fileName, err => { if (err) throw err })
    const stats = fs.statSync(fileName)
    if (stats.size >= 8388608) {
      await botMessage.edit({ content: `${message.author} я не могу отправить файл, так как он весит больше чем 8мб.` })
    } else {
      await botMessage.edit({ content: `${message.author} я смог извлечь звук`, files: [fileName] })
    }

    fs.unlink(fileName, err => { if (err) throw err })
  }).pipe(filePath)
}
