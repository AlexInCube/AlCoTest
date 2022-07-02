const DisTubeLib = require('distube')
const Discord = require('discord.js')
const { SpotifyPlugin } = require('@distube/spotify')
const { YtDlpPlugin } = require('@distube/yt-dlp')
const { SoundCloudPlugin } = require('@distube/soundcloud')
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice')
const fs = require('fs')
const ytdl = require('ytdl-core')
const voice = require('@discordjs/voice')
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js')
const { Song } = require('distube')
const { getData } = require('spotify-url-info')
const { filledBar } = require('string-progressbar')

const PLAYER_STATES = {
  waiting: 0,
  playing: 1,
  paused: 2
}

const PLAYER_FIELDS = {
  author: 0,
  duration: 1,
  queue_duration: 2,
  remaining_songs: 3,
  repeat_mode: 4,
  requester: 5
}

class AudioPlayerModule {
  constructor (client, options = {}) {
    this.client = client
    this.musicPlayerMap = {}
    this.prefix = options.prefix || '//'
    // eslint-disable-next-line new-cap
    this.distube = new DisTubeLib.default(client, {
      searchSongs: 10,
      searchCooldown: 30,
      leaveOnEmpty: true,
      emptyCooldown: 20,
      leaveOnFinish: true,
      leaveOnStop: true,
      youtubeDL: false,
      updateYouTubeDL: false,
      youtubeCookie: options.ytcookie || undefined,
      nsfw: true,
      emitAddListWhenCreatingQueue: true,
      emitAddSongWhenCreatingQueue: true,
      plugins: [
        new SpotifyPlugin(
          {
            parallel: true,
            emitEventsAfterFetching: true,
            api: {
              clientId: options.spotify.clientId || undefined,
              clientSecret: options.spotify.clientSecret || undefined
            }
          }),
        new YtDlpPlugin(),
        new SoundCloudPlugin()
      ]
    })
    this.setupEvents()
  }

  setupEvents () {
    this.distube
      .on('error', async (textChannel, e) => {
        if (e.errorCode === 'UNAVAILABLE_VIDEO') {
          await textChannel.send('Это видео недоступно из-за жестокости')
          if (this.getQueue(textChannel.guild)) {
            await this.distube.skip(textChannel.guild)
          }
          return
        }
        console.error(e)
        textChannel.send(`Произошла ошибка: ${e.stack}`.slice(0, 2000))
      })
      .on('playSong', async (musicQueue, song) => {
        if (!this.musicPlayerMap[musicQueue.textChannel.guildId]) return
        await this.restorePlayerMessage(musicQueue.textChannel.guild, musicQueue)
        await this.updateEmbedWithSong(musicQueue, song)
        await this.pushChangesToPlayerMessage(musicQueue.textChannel.guildId, musicQueue)
      })
      .on('addSong', async (musicQueue, song) => {
        await musicQueue.textChannel.send({
          content: `Добавлено: ${song.name} - \`${song.formattedDuration}\` в очередь по запросу \`${song.member.user.username}\``
        })
        await this.restorePlayerMessage(musicQueue.textChannel.guild, musicQueue)
        await this.updateEmbedWithSong(musicQueue, musicQueue.songs[0])
        await this.pushChangesToPlayerMessage(musicQueue.textChannel.guildId, musicQueue)
      })
      .on('addList', async (musicQueue, playlist) => {
        musicQueue.textChannel.send({
          content:
            `Добавлено \`${playlist.songs.length}\` песен из плейлиста \`${playlist.name}\` в очередь по запросу \`${playlist.member.user.username}\``
        })
        await this.restorePlayerMessage(musicQueue.textChannel.guild, musicQueue)
        await this.updateEmbedWithSong(musicQueue, musicQueue.songs[0])
        await this.pushChangesToPlayerMessage(musicQueue.textChannel.guildId, musicQueue)
      })
      .on('finishSong', async musicQueue => {
        const guild = musicQueue.textChannel.guildId
        if (!musicQueue.next) {
          await this.setPlayerEmbedState(guild, PLAYER_STATES.waiting)
          if (!this.musicPlayerMap[guild]) { return }
          await this.pushChangesToPlayerMessage(guild, musicQueue)
        }
      })
      .on('disconnect', async musicQueue => {
        await this.stop(musicQueue.textChannel.guild)
      })
      .on('searchResult', async (userMessage, results) => {
        let resultsFormattedList = ''// Превращаем список в то что можно вывести в сообщение

        results.forEach((item, index) => { // Перебираем все песни в списке и превращаем в вывод для отображения результата поиска
          resultsFormattedList += `**${index + 1}**.  ` + `[${item.name}](${item.url})` + ' — ' + ` \`${item.formattedDuration}\` ` + '\n'
        })

        const resultsEmbed = new Discord.MessageEmbed()
          .setColor('#436df7')
          .setAuthor({ name: '🔍 Результаты поиска 🔎' })
          .setTitle(`Напишите число песни (без префикса ${this.prefix}), чтобы выбрать её, у вас есть 30 секунд! \n Для отмены напишите что угодно кроме числа.`)
          .setDescription(resultsFormattedList)

        await userMessage.channel.send({ embeds: [resultsEmbed] })
      }
      )
      .on('searchNoResult', async (message, query) => { message.channel.send(`Ничего не найдено по запросу ${query}!`); await this._handleCancelSearch(message.guild) })
      .on('searchInvalidAnswer', async (message) => { message.channel.send('Вы указали что-то неверное, поиск отменён!'); await this._handleCancelSearch(message.guild) })
      .on('searchCancel', async (message) => { message.channel.send('Вы ничего не выбрали, поиск отменён'); await this._handleCancelSearch(message.guild) })
      .on('searchDone', () => {})
  }

  getQueue (guild) {
    return this.distube.getQueue(guild)
  }

  async _handleCancelSearch (guild) {
    const queue = this.getQueue(guild)
    if (queue === undefined) {
      await this.stop(guild)
    }
  }

  async play (queryMessage, queryArgs) {
    let userSearch = ''// Эта переменная становится запросом который дал пользователь, ссылка (трек или плейлист), прикреплённый файл или любая белеберда будет работать как поиск

    if (queryMessage.attachments.size > 0) { // Если к сообщению прикреплены аудиофайлы
      userSearch = queryMessage.attachments.first().url// Берём ссылку из Discord CDN на файл
      if (!userSearch.endsWith('.mp3') && !userSearch.endsWith('.wav') && !userSearch.endsWith('.ogg')) {
        await queryMessage.reply('Это не аудиофайл, это чёрт пойми что!')
        return
      }
    } else { // Если файлов всё таки нет, то проверяем правильность ввода ссылки или белеберды
      if (queryArgs[0] === undefined) {
        await queryMessage.reply('А что ты слушать хочешь то, а? Укажи хоть что-нибудь.')
        return
      }// Если пользователь ничего не предоставил
      if (queryArgs[0] === '') {
        await queryMessage.reply('Ты как-то неправильно ввёл название, попробуй ещё раз.')
        return
      }// Защита от случайного пробела после команды
      if (isValidURL(queryArgs[0])) {
        userSearch = queryArgs[0]
      } else {
        queryArgs.forEach((item) => { // Складываем в кучу все аргументы пользователя, чтобы удобнее было составлять запрос на поиск песен
          userSearch += `${item} `
        })
      }
    }

    const connection = getVoiceConnection(queryMessage.guild.id)

    if (connection) {
      if (!await this.checkUserInVoice(queryMessage.member, queryMessage)) return
    }

    if (queryMessage.member.voice.channel == null) { await queryMessage.reply('Зайди сначала в любой голосовой канал'); return }

    const options = {
      textChannel: queryMessage.channel,
      message: queryMessage,
      member: queryMessage.member
    }

    joinVoiceChannel({
      channelId: queryMessage.member.voice.channel.id,
      guildId: queryMessage.guild.id,
      adapterCreator: queryMessage.guild.voiceAdapterCreator
    })

    await this.distube.play(queryMessage.member.voice.channel, userSearch, options)
  }

  /**
   * Редактирует значения поля в плеере, но не отправляет изменения в сообщение в Discord
   *
   * @param guildID
   * @param field - PLAYERFIELDS.author || duration || queue_duration || remaining_songs || repeat_mode
   * @param value
   */
  editField (guildID, field, value) {
    this.musicPlayerMap[guildID].PlayerEmbed.fields[field].value = value || 'Неизвестно'
  }

  async checkUserInVoice (member, messageForReply = null) {
    if (!member.voice.channel) {
      if (messageForReply != null) await messageForReply.reply('Зайди сначала в любой голосовой канал')
      return false
    }

    const connection = getVoiceConnection(member.guild.id)
    if (connection) {
      if (connection.joinConfig.channelId !== member.voice.channel.id) {
        this.client.channels.fetch(connection.joinConfig.channelId)
          .then(channel => {
            if (messageForReply != null) {
              messageForReply.reply({ content: `Зайди на канал ${channel.name} ` })
            }
            return false
          })
      }
    }

    return true
  }

  async getPlayerMessageInGuild (guild) {
    const guildId = guild.id
    const channel = await this.client.channels.cache.get(this.musicPlayerMap[guildId]?.ChannelID)
    if (!channel) return undefined
    return channel.messages.cache.get(this.musicPlayerMap[guildId]?.MessageID)
  }

  async downloadSong (song, message, username) {
    try {
      if (song.isLive) {
        await message.channel.send({ content: `${username} это прямая трансляция, её нельзя скачать!` })
        return 0
      }

      const fileName = `${song.name.replaceAll(/[&/\\#,+()$~%.'":*?<>|{}]/g, '')}.mp3`
      const filePath = await fs.createWriteStream(fileName)
      ytdl(song.url, { filter: 'audioonly', format: 'mp3', quality: 'lowestaudio' }).on('end', async () => {
        await fs.rename(filePath.path, fileName, err => { if (err) throw err })
        const stats = fs.statSync(fileName)
        if (stats.size >= 8388608) {
          await message.channel.send({ content: `${username} я не могу отправить файл, так как он весит больше чем 8мб.` })
        } else {
          await message.channel.send({ content: `${username} я смог извлечь звук`, files: [fileName] })
        }

        fs.unlink(fileName, err => { if (err) throw err })
      }).pipe(filePath)
    } catch (e) {
      await message.channel.send({ content: `${username} произошла ошибка, попробуйте ещё раз` })
    }
  }

  async skipSong (queue, message, username) {
    if (queue.songs.length > 1) {
      await message.reply({ content: `${username} пропустил песню ${queue.songs[0].name} - ${queue.songs[0].uploader.name}` })
      await this.distube.skip(queue.textChannel.guild)
      await this.resume(queue.textChannel.guild)
    }
  }

  async changeRepeatMode (message) {
    const queue = this.getQueue(message)
    if (queue) {
      const repeat = queue.repeatMode
      let mode
      switch (repeat) {
        case 0:
          queue.setRepeatMode(1)
          mode = 'Песня'
          break
        case 1:
          queue.setRepeatMode(2)
          mode = 'Очередь'
          break
        case 2:
          queue.setRepeatMode(0)
          mode = 'Выключен'
          break
      }
      this.distube.emit('repeatChanged', queue)

      this.editField(message.guild.id, PLAYER_FIELDS.repeat_mode, mode)
      await message.edit({ embeds: [this.musicPlayerMap[message.guild.id].PlayerEmbed] })
    }
  }

  async pause (messageWithPlayer) {
    const queue = this.getQueue(messageWithPlayer)
    if (queue.paused) {
      await this.resume(messageWithPlayer)
    } else {
      await this.distube.pause(messageWithPlayer)
      this.distube.emit('pause', queue)
      await this.setPlayerEmbedState(messageWithPlayer.guild.id, PLAYER_STATES.paused)
    }

    await messageWithPlayer.edit({ embeds: [this.musicPlayerMap[messageWithPlayer.guild.id].PlayerEmbed] })
  }

  async resume (messageWithPlayer) {
    const queue = this.getQueue(messageWithPlayer)
    if (!queue.paused) return
    await this.distube.resume(messageWithPlayer)
    await this.setPlayerEmbedState(messageWithPlayer.guild.id, PLAYER_STATES.playing)
    this.distube.emit('resume', queue)
    await messageWithPlayer.edit({ embeds: [this.musicPlayerMap[messageWithPlayer.guild.id].PlayerEmbed] })
  }

  async stop (guild) {
    const vc = voice.getVoiceConnection(guild.id)
    if (vc) await voice.getVoiceConnection(guild.id).destroy()
    await this.clearPlayerState(guild)
  }

  async clearPlayerState (guild) {
    if (this.musicPlayerMap[guild.id]) {
      await this.musicPlayerMap[guild.id].Collector.stop()
      const playerMessage = await this.getPlayerMessageInGuild(guild)
      if (playerMessage !== undefined) {
        playerMessage.delete()
      }
      delete this.musicPlayerMap[guild.id]
    }
  }

  async pushChangesToPlayerMessage (guildID, musicQueue) {
    try {
      let message
      const channel = await musicQueue.textChannel.fetch(this.musicPlayerMap[guildID].ChannelID)
      if (channel) {
        message = await channel.messages.fetch(this.musicPlayerMap[guildID].MessageID)
      }
      if (message) {
        await message.edit({ embeds: [this.musicPlayerMap[guildID].PlayerEmbed] })
      }
    } catch (e) {

    }
  }

  /**
   * Меняет состояние плеера (цвет, текст), но не отправляет изменения в сообщение в Discord
   *
   * @param guildID
   * @param state - waiting || playing || paused
   */
  async setPlayerEmbedState (guildID, state) {
    switch (state) {
      case PLAYER_STATES.waiting:
        await this.musicPlayerMap[guildID].PlayerEmbed.setTitle('').setURL('').setAuthor({ name: '💿 Ожидание 💿' }).setColor('#43f7f7').setThumbnail(null)
        this.editField(guildID, PLAYER_FIELDS.author, undefined)
        this.editField(guildID, PLAYER_FIELDS.duration, undefined)
        this.editField(guildID, PLAYER_FIELDS.queue_duration, undefined)
        this.editField(guildID, PLAYER_FIELDS.remaining_songs, undefined)
        break

      case PLAYER_STATES.playing:
        await this.musicPlayerMap[guildID].PlayerEmbed.setAuthor({ name: '🎵 Играет 🎵' }).setColor('#49f743')
        break

      case PLAYER_STATES.paused:
        await this.musicPlayerMap[guildID].PlayerEmbed.setAuthor({ name: '⏸️ Пауза ⏸️ ' }).setColor('#f74343')
        break
    }
  }

  async restorePlayerMessage (guild, queue) {
    if (this.musicPlayerMap[guild.id]) {
      try {
        const messagePlayer = await this.getPlayerMessageInGuild(guild)
        if (messagePlayer === undefined) {
          await this.clearPlayerState(guild)
        }
      } catch (e) {

      }
    }
    await this.createPlayer(queue)
  }

  async updateEmbedWithSong (queue, song) {
    const guild = queue.textChannel.guildId
    await this.setPlayerEmbedState(guild, PLAYER_STATES.playing)
    this.editField(guild, PLAYER_FIELDS.author, song.uploader.name)
    this.editField(guild, PLAYER_FIELDS.requester, song.user.username)
    if (song.isLive) {
      this.editField(guild, PLAYER_FIELDS.duration, ':red_circle:' + ' Прямая трансляция')
    } else {
      this.editField(guild, PLAYER_FIELDS.duration, song.formattedDuration)
    }
    this.editField(guild, PLAYER_FIELDS.queue_duration, queue.formattedDuration)
    this.editField(guild, PLAYER_FIELDS.remaining_songs, (queue.songs.length - 1).toString())
    await this.musicPlayerMap[guild].PlayerEmbed.setThumbnail(song.thumbnail).setTitle(song.name).setURL(song.url)
  }

  async createPlayer (queue) {
    await this.clearPlayerState(queue.textChannel.guild)
    const Player = this.createPlayerEmbed()

    const guildId = queue.textChannel.guild.id

    const musicPlayerMessage = await queue.textChannel.send(Player) // Отправляем сообщение с плеером
    this.musicPlayerMap[guildId] = {
      MessageID: musicPlayerMessage.id,
      ChannelID: musicPlayerMessage.channel.id,
      PlayerEmbed: Player.embeds[0],
      Collector: ''
    }

    const filter = button => button.customId

    const collector = musicPlayerMessage.channel.createMessageComponentCollector({ filter })
    this.musicPlayerMap[guildId].Collector = collector

    collector.on('collect', async button => {
      try {
        if (button.customId === 'show_queue') {
          const showQueue = this.getQueue(button.guild)
          if (!showQueue) {
            await button.reply({ content: 'Ничего не проигрывается', ephemeral: true })
          } else {
            let queueList = ''

            let song = ''
            for (let i = 1; i < Math.min(31, showQueue.songs.length); i++) {
              song = showQueue.songs[i]
              queueList += `${i + 1}. ` + `[${song.name}](${song.url})` + ` - \`${song.formattedDuration}\`\n`
            }

            if (showQueue.songs.length > 32) {
              queueList += `И ещё ${showQueue.songs.length - 33} песни ждут своего часа`
            }

            const queueEmbed = new Discord.MessageEmbed()
              .setAuthor({ name: 'Сейчас играет: ' })
              .setTitle('1. ' + showQueue.songs[0].name).setURL(showQueue.songs[0].url)
              .setDescription(`**Оставшиеся песни: **\n${queueList}`.slice(0, 4096))
            await button.reply({ embeds: [queueEmbed], ephemeral: true }
            )
          }
        }

        if (button.customId === 'download_song') {
          const song = this.getQueue(queue.textChannel.guild).songs[0]

          await this.downloadSong(song, button.message, button.user.username)
        }

        if (!await this.checkUserInVoice(button.member, button.message)) {
          await button.message.channel.send({ content: `${button.user.username} попытался нажать на кнопки, но он не в голосовом чате со мной!` })
          return
        }

        if (button.customId === 'stop_music') {
          const vc = voice.getVoiceConnection(button.guild.id)
          if (vc) await voice.getVoiceConnection(button.guild.id).destroy()
          await button.message.channel.send({ content: `${button.user.username} выключил плеер` })
        }

        if (button.customId === 'pause_music') {
          await this.pause(button.message)
          await button.deferUpdate()
        }

        if (button.customId === 'toggle_repeat') {
          await this.changeRepeatMode(button.message)
          await button.deferUpdate()
        }

        if (button.customId === 'skip_song') {
          await this.skipSong(this.getQueue(queue.textChannel.guild), button.message, button.user.username)
          await button.deferUpdate()
        }
      } catch (e) {
        try {
          await button.deferUpdate()
        } catch (e) {

        }
      }
    })
  }

  /**
   * Создаёт embed сообщение с интерфейсом Аудио Плеера, но не отправляет его.
   */
  createPlayerEmbed () {
    const musicPlayerEmbed = new Discord.MessageEmbed()// Создаём сообщение с плеером
      .setColor('#f7ee43')
      .setAuthor({ name: '⌛ Загрузка ⌛' })
      .addFields(
        { name: 'Автор', value: 'Неизвестно' },
        { name: 'Длительность песни', value: 'Неизвестно', inline: false },
        { name: 'Оставшаяся длительность очереди', value: 'Неизвестно', inline: false },
        { name: 'Осталось песен в очереди', value: 'Неизвестно', inline: true },
        { name: 'Режим повтора', value: 'Выключен', inline: true },
        { name: 'Эту песню запросил', value: 'Неизвестно', inline: true }
      )

    const musicPlayerRowPrimary = new MessageActionRow()// Создаём кнопки для плеера
      .addComponents(
        new MessageButton().setCustomId('stop_music').setLabel('Выключить').setStyle('DANGER'),
        new MessageButton().setCustomId('pause_music').setLabel('Пауза / Возобновить').setStyle('PRIMARY'),
        new MessageButton().setCustomId('toggle_repeat').setLabel('Переключить режим повтора').setStyle('PRIMARY'),
        new MessageButton().setCustomId('skip_song').setLabel('Пропустить').setStyle('PRIMARY')
      )

    const musicPlayerRowSecondary = new MessageActionRow()// Создаём кнопки для плеера
      .addComponents(
        new MessageButton().setCustomId('show_queue').setLabel('Показать очередь').setStyle('SECONDARY'),
        new MessageButton().setCustomId('download_song').setLabel('Скачать песню').setStyle('SECONDARY')
      )

    return { embeds: [musicPlayerEmbed], components: [musicPlayerRowPrimary, musicPlayerRowSecondary] }
  }

  async extractAudioToMessage (message, queryArgs) {
    const url = queryArgs[0]
    if (!url) { message.reply('А ссылку указать? Мне что самому надо придумать что тебе надо?') }
    let songData
    let searchQuery = ''

    const botMessage = await message.channel.send({ content: `${message.author} ожидайте...` })

    if (url.startsWith('https://www.youtube.com')) {
      songData = new Song(await ytdl.getBasicInfo(url))
      await this.downloadSong(songData, message, message.author.username)
      return
    }

    if (url.startsWith('https://open.spotify.com')) {
      await getData(url).then(data => {
        searchQuery = data.name
      })
    } else {
      queryArgs.forEach((item) => {
        searchQuery += `${item} `
      })
    }

    searchQuery.slice(0, -1)

    try {
      songData = await this.distube.search(searchQuery, { limit: 1, type: 'video' }).then(function (result) {
        return result[0]
      })
    } catch (e) {
      await botMessage.edit({ content: `${message.author} я не смог ничего найти` })
      return
    }

    await this.downloadSong(songData, message, message.author.username)
  }

  async jump (guild, queuePosition, queryMessage = null, username = null) {
    const queue = this.getQueue(guild)

    if (!queue) { await queryMessage?.reply('Никакой очереди не существует'); return }
    if (isNaN(queuePosition)) { await queryMessage?.reply('Это не число'); return }

    const messageWithPlayer = await this.getPlayerMessageInGuild(guild)
    await this.resume(messageWithPlayer)

    queuePosition = clamp(parseInt(queuePosition), 0 - queue.previousSongs.length, queue.songs.length - 1)
    try {
      await this.distube.jump(guild, queuePosition)
      if (username) {
        await this.getPlayerMessageInGuild(guild).then(async (playerMessage) => {
          if (queuePosition >= 1) { await playerMessage.reply(`${username} совершил прыжок в очереди, пропустив предыдущие песни`); return }
          if (queuePosition <= 0) { await playerMessage.reply(`${username} совершил прыжок в очереди, вернувшись назад на проигранные песни`) }
        })
      }
    } catch (e) {

    }
  }

  async previousSong (guild, message, username) {
    await this.jump(guild, -1, message, username)
  }

  async getCurrentPlayingMessage (message) {
    const queue = this.getQueue(message.guild)

    if (!queue) { message.channel.send('Очереди не существует'); return }

    const progressBar = filledBar(queue.duration, queue.currentTime, 40, '-', '=')
    const durationString = queue.formattedCurrentTime + ` ${progressBar[0]} ` + queue.formattedDuration

    const playingEmbed = new MessageEmbed()
      .setTitle(queue.songs[0].name)
      .setURL(queue.songs[0].url)
      .setDescription(durationString)

    await message.channel.send({ embeds: [playingEmbed], ephemeral: true })

    await message.delete()
  }

  async position (message = null, queryArgs) {
    const queue = this.getQueue(message)

    if (!queue) { message?.channel.send('Очереди не существует'); return }

    if (queue.songs[0].isLive) {
      message?.reply({ content: 'Нельзя перематывать прямые трансляции' })
      return
    }

    if (!queryArgs) { message?.reply({ content: `А время указать? Не понимаешь как? Пиши ${this.prefix}help position` }); return }

    let totalTime = 0
    queryArgs.forEach(arg => {
      totalTime += parseTime(arg)
    })

    if (!Number.isInteger(totalTime)) { message?.reply({ content: 'Я не понял что ты написал' }); return }

    const previousTime = queue.formattedCurrentTime

    await this.distube.seek(queue, Number(totalTime))

    message?.reply({ content: `Время изменено с ${previousTime} на ${queue.formattedCurrentTime}` })

    function parseTime (time) {
      const lastTimeChar = time.charAt(time.length - 1)
      try {
        time = parseInt(time.slice(0, -1))
        switch (lastTimeChar) {
          case 'h':
            return time * 60 * 60
          case 'm':
            return time * 60
          case 's':
            return time
          default:
            return 0
        }
      } catch (e) {
        return undefined
      }
    }
  }

  async shuffle (message, username) {
    const queue = this.getQueue(message)
    if (queue) {
      await this.distube.shuffle(queue)
      message.channel.send(`${username} перемешал все песни`)
      this.distube.emit('shuffleQueue', queue)
    }
  }

  async deleteSongFromQueue (guild, position, username) {
    const messageWithPlayer = await this.getPlayerMessageInGuild(guild)
    if (!messageWithPlayer) return
    const queue = this.distube.getQueue(guild)
    if (!queue) return
    position = clamp(parseInt(position), 0 - queue.previousSongs.length, queue.songs.length - 1)
    if (position === 0) {
      await this.skipSong(queue, messageWithPlayer, username)
    } else if (position > 0) {
      await messageWithPlayer.channel.send({ content: `${username} удалил песню из очереди ${queue.songs[position].name} - ${queue.songs[position].uploader.name}` })
      queue.songs.splice(position, 1)
    } else if (position < 0) {
      position = queue.previousSongs.length - Math.abs(position)
      await messageWithPlayer.channel.send({ content: `${username} удалил песню из списка прошлых песен ${queue.previousSongs[position].name} - ${queue.previousSongs[position].uploader.name}` })
      queue.previousSongs.splice(position, 1)
    }
    this.editField(queue.textChannel.guild.id, PLAYER_FIELDS.remaining_songs, (queue.songs.length - 1).toString())
    await messageWithPlayer.edit({ embeds: [this.musicPlayerMap[queue.textChannel.guild.id].PlayerEmbed] })
    this.distube.emit('songDeleted', queue)
  }
}

module.exports = { AudioPlayerModule }

function isValidURL (str) {
  const pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', 'i') // fragment locator
  return !!pattern.test(str)
}

function clamp (num, min, max) {
  return Math.min(Math.max(num, min), max)
}
