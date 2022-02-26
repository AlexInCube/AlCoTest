const Discord = module.require('discord.js')
require('fs')
const { distube } = require('../../main')
const { isValidURL, generateRandomCharacters, clamp, CheckAllNecessaryPermission } = require('../../custom_modules/tools')
const { RepeatMode } = require('distube')
const { getVoiceConnection } = require('@discordjs/voice')
const { Permissions } = require('discord.js')
const fs = require('fs')
const ytdl = require('ytdl-core')
const Audioplayer = require('../../custom_modules/Audioplayer/Audioplayer')
const { PLAYER_FIELDS, pausePlayer } = require('../../custom_modules/Audioplayer/Audioplayer')

module.exports.help = {
  name: 'play',
  group: 'audio',
  arguments: '(запрос)',
  description:
        'Проигрывает музыку указанную пользователем. \n' +
        'Принимаются:\n Ссылка с Youtube/Spotify/Soundcloud\n1 прикреплённый аудиофайл (mp3, wav или ogg)\nЛюбая писанина, будет запросом на поиск',
  bot_permissions: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.CONNECT, Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SPEAK, Permissions.FLAGS.MANAGE_MESSAGES, Permissions.FLAGS.ATTACH_FILES]
}

module.exports.run = async (client, message, args) => {
  // Пытаемся устранить все ошибки пользователя
  if (!message.member.voice.channel) { await message.reply('Зайди сначала в голосовой канал'); return }
  let userSearch = ''// Эта переменная становится запросом который дал пользователь, ссылка (трек или плейлист), прикреплённый файл или любая белеберда будет работать как поиск

  if (message.attachments.size > 0) { // Если к сообщению прикреплены аудиофайлы
    userSearch = message.attachments.first().url// Берём ссылку из Discord CDN на файл
    if (!userSearch.endsWith('.mp3') && !userSearch.endsWith('.wav') && !userSearch.endsWith('.ogg')) {
      await message.reply('Это не аудиофайл, это чёрт пойми что!'); return
    }
  } else { // Если файлов всё таки нет, то проверяем правильность ввода ссылки или белеберды
    if (args[0] === undefined) { await message.reply('А что ты слушать хочешь, то а? Укажи хоть что-нибудь.'); return }// Если пользователь ничего не предоставил
    if (args[0] === '') { await message.reply('Ты как-то неправильно ввёл название, попробуй ещё раз.'); return }// Защита от случайного пробела после команды

    args.forEach((item) => { // Складываем в кучу все аргументы пользователя, чтобы удобнее было составлять запрос на поиск песен
      userSearch += item
    })
  }

  let songToPlay// Эта штука должна становится окончательной ссылкой для проигрывания
  const guildID = message.guildId

  if (isValidURL(userSearch)) { // Если то что дал пользователь можно рассчитывать как ссылку
    songToPlay = userSearch// Внезапно это оказалась ссылка, то сразу ебашим запрос в плеер
    await startPlayer()
  } else {
    await searchSong()// А если не удалось понять что это ссылка, то ищем песню
  }

  async function searchSong () { // Предлагаем поиск из 10 песен для пользователя
    let foundSongs// Список найденных песен
    try {
      foundSongs = await distube.search(userSearch, { limit: 10 }).then(function (result) { // Ищем песни
        return result
      })
    } catch (e) {
      await message.reply({ content: 'Ничего не найдено', ephemeral: true })
      return
    }

    let foundSongsFormattedList = ''// Превращаем список в то что можно вывести в сообщение

    foundSongs.forEach((item, index) => { // Перебираем все песни в списке и превращаем в вывод для отображения результата поиска
      foundSongsFormattedList += `**${index + 1}**.  ` + `[${item.name}](${item.url})` + ' — ' + ` \`${item.formattedDuration}\` ` + '\n'
    })

    const foundSongsEmbed = new Discord.MessageEmbed()
      .setColor('#436df7')
      .setAuthor({ name: '🔍 Результаты поиска 🔎' })
      .setTitle('Напишите число песни (без префикса //), чтобы выбрать её, у вас есть 30 секунд!')
      .setDescription(foundSongsFormattedList)

    const filter = m => m.author.id === message.author.id// Принимаем номер поиска только от того кто делал запрос

    await message.channel.send({ embeds: [foundSongsEmbed] }).then((collected) => { // Отправляем сообщение с результатами
      const resultMessage = collected

      message.channel.awaitMessages({ // Ждём цифру от пользователя с песней из результата
        filter,
        max: 1,
        time: 30000,
        errors: ['time']
      })
        .then(async selectMessage => {
          selectMessage = selectMessage.first()
          const parsedSelectedSong = parseInt(selectMessage.content)// Пытаемся конвертировать сообщение в строку
          if (!isNaN(parsedSelectedSong) && !Number.isInteger(selectMessage.content)) { // Если это число, то указываем пределы.
            songToPlay = foundSongs[clamp(parsedSelectedSong, 1, 10) - 1]// Забираем окончательную ссылку на видео
            await startPlayer()
            await selectMessage.delete()
            await resultMessage.delete()
          } else {
            await selectMessage.reply({
              content: 'Вы указали что-то неверное, проверьте запрос!',
              ephemeral: true
            })
            await message.delete()
            await resultMessage.delete()
          }
        })
        .catch(async () => { // Если истёк таймер
          await message.reply({ content: 'Вы ничего не выбрали', ephemeral: true })
          await message.delete()
          resultMessage.delete()
        })
    })
  }

  async function startPlayer () { // Собственно плеер, сердце этой команды.
    const userChannel = message.member.voice.channel
    const options = {
      textChannel: message.channel,
      member: message.member
    }
    try {
      if (musicPlayerMap[guildID]) {
        await distube.play(userChannel, songToPlay, options)
        return
      }
    } catch (e) {
      message.channel.send('Что-то не так с этим аудио, возможно он не доступен в стране бота (Украина)')
      return
    }

    const Player = Audioplayer.createPlayerEmbed()

    const musicPlayerMessage = await message.channel.send(Player) // Отправляем сообщение с плеером
    musicPlayerMap[guildID] = {
      MessageID: musicPlayerMessage.id,
      ChannelID: musicPlayerMessage.channel.id,
      PlayerEmbed: Player.embeds[0],
      Collector: ''
    }

    const filter = button => button.customId

    const collector = musicPlayerMessage.channel.createMessageComponentCollector({ filter })
    musicPlayerMap[guildID].Collector = collector

    await message.delete()

    collector.on('collect', async button => {
      if (!CheckAllNecessaryPermission(client, message, module.exports.help.bot_permissions)) { return }

      const connection = getVoiceConnection(message.guildId)

      if (button.customId === 'show_queue') {
        const queue = distube.getQueue(message)
        if (!queue) {
          await button.reply({ content: 'Ничего не проигрывается', ephemeral: true })
        } else {
          let queueList = ''
          queue.songs.forEach((song, id) => {
            if (id === 0) { return }
            queueList += `${id}. ` + `[${song.name}](${song.url})` + ` - \`${song.formattedDuration}\`\n`
          })

          const queueEmbed = new Discord.MessageEmbed()
            .setAuthor({ name: 'Сейчас играет: ' })
            .setTitle(queue.songs[0].name).setURL(queue.songs[0].url)
            .setDescription(`**Оставшиеся песни: **\n${queueList}`.slice(0, 4096))
          await button.reply({ embeds: [queueEmbed], ephemeral: true }
          )
        }
      }

      if (button.customId === 'download_song') {
        const filePath = fs.createWriteStream(`${generateRandomCharacters(15)}.mp3`)
        const song = distube.getQueue(message).songs[0]

        const fileName = `${song.name}.mp3`
        ytdl(song.url, { filter: 'audioonly', format: 'mp3' }).on('end', async () => {
          await fs.rename(filePath.path, fileName, err => { if (err) throw err })
          const stats = fs.statSync(fileName)
          if (stats.size >= 8388608) {
            await button.message.channel.send({ content: `${message.author} я не могу отправить файл, так как он весит больше чем 8мб.` })
          } else {
            await button.message.channel.send({ content: `${message.author} я смог извлечь звук`, files: [fileName] })
          }

          fs.unlink(fileName, err => { if (err) throw err })
        }).pipe(filePath)
      }

      if (connection) {
        if (connection.joinConfig.channelId !== button.member.voice.channelId) {
          await button.message.channel.send({ content: `${button.user.username} попытался нажать на кнопки, но он не в голосовом чате со мной!` })
          return
        }
      } else {
        if (distube.getQueue(message)) {
          await distube.stop(message)
        }
      }

      /*
            if(button.member.permissions.has('MANAGE_GUILD') || button.member.user.id === message.author.id || message.guild.me.voice.channel.members.size < 2){
            }else{
                await button.reply({content: "У тебя нехватает прав на нажатие кнопок плеера", ephemeral: true})
                return
            }
      */
      if (button.customId === 'stop_music') {
        await Audioplayer.stopPlayer(distube, message.guild)
        await button.message.channel.send({ content: `${button.user.username} выключил плеер` })
      }

      if (button.customId === 'pause_music') {
        await pausePlayer(distube, button.message)
        await button.deferUpdate()
      }

      if (button.customId === 'toggle_repeat') {
        const queue = distube.getQueue(message)
        if (queue) {
          const repeat = queue.repeatMode
          let mode
          switch (repeat) {
            case RepeatMode.DISABLED:
              queue.setRepeatMode(1)
              mode = 'Песня'
              break
            case RepeatMode.SONG:
              queue.setRepeatMode(2)
              mode = 'Очередь'
              break
            case RepeatMode.QUEUE:
              queue.setRepeatMode(0)
              mode = 'Выключен'
              break
          }

          Audioplayer.editField(guildID, PLAYER_FIELDS.repeat_mode, mode)
        }
        await button.update({ embeds: [musicPlayerMap[guildID].PlayerEmbed] })
      }

      if (button.customId === 'skip_song') {
        try {
          await distube.skip(message)
          await button.reply({ content: `По запросу от ${button.user} была пропущена песня` })
          if (distube.getQueue(message).paused) {
            await distube.resume(message)
          }
        } catch (e) {
          await button.reply({ content: 'В очереди дальше ничего нет', ephemeral: true })
        }
      }
    })

    try {
      await distube.play(userChannel, songToPlay, options)
    } catch (e) {
      message.channel.send('Что-то не так с этим аудио, возможно он не доступен в стране бота (Украина)')
    }
  }
}
