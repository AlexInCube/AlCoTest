const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const { PLAYER_STATES } = require('./AudioPlayerEnums')
const { checkMemberInVoiceWithBotAndReply } = require('../../utilities/checkMemberInVoiceWithBot')
const { loggerSend } = require('../../utilities/logger')
const { downloadSong, deleteSongFile } = require('./downloadSongHandling')
const { RepeatMode } = require('distube')
const { AudioPlayerEvents } = require('./AudioPlayerEvents')
const { secondsToFormattedTime } = require('../../utilities/secondsToFormattedTime')

const PLAYER_FIELDS = {
  author: 0,
  duration: 1,
  queue_duration: 2,
  next_song: 3,
  remaining_songs: 4,
  repeat_mode: 5,
  requester: 6
}

class AudioPlayerDiscordGui {
  constructor (musicPlayerMap, distube, playerEmitter, client) {
    this.musicPlayerMap = musicPlayerMap
    this.distube = distube
    this.playerEmitter = playerEmitter
    this.client = client

    this.setupGuiEvents()
  }

  setupGuiEvents () {
    this.distube
      /*
      .on('initQueue', async (musicQueue) => {
        if (!this.musicPlayerMap[musicQueue.textChannel.guildId]) return
        await this.restorePlayerMessage(musicQueue.textChannel.guild, musicQueue)
      })
       */
      .on('playSong', async (musicQueue, song) => {
        if (!this.musicPlayerMap[musicQueue.textChannel.guildId]) return
        await this.restorePlayerMessage(musicQueue.textChannel.guild, musicQueue)
        await this.updateEmbedWithSong(musicQueue, song)
        await this.pushChangesToPlayerMessage(musicQueue.textChannel.guild)
      })
      .on('addSong', async (musicQueue, song) => {
        const songEmbed = new EmbedBuilder()
          .setTitle(song.name)
          .setURL(song.url)
          .setAuthor({ name: `🎵${song.member.user.username} добавил песню🎵` })
          .setDescription(`Длительность - ${song.formattedDuration} | Автор - ${song.uploader.name}`)
          .setThumbnail(song.thumbnail)
        await musicQueue.textChannel.send({ embeds: [songEmbed] })

        await this.restorePlayerMessage(musicQueue.textChannel.guild, musicQueue)
        await this.updateEmbedWithSong(musicQueue, musicQueue.songs[0])
        await this.pushChangesToPlayerMessage(musicQueue.textChannel.guild)
      })
      .on('addList', async (musicQueue, playlist) => {
        const playlistEmbed = new EmbedBuilder()
          .setTitle(playlist.name)
          .setURL(playlist.url)
          .setAuthor({ name: `🎶${playlist.member.user.username} добавил плейлист🎶` })
          .setDescription(`Количество песен - ${playlist.songs.length} | Длительность - ${playlist.formattedDuration}`)
          .setThumbnail(playlist.thumbnail)

        await musicQueue.textChannel.send({ embeds: [playlistEmbed] })
        await this.restorePlayerMessage(musicQueue.textChannel.guild, musicQueue)
        await this.updateEmbedWithSong(musicQueue, musicQueue.songs[0])
        await this.pushChangesToPlayerMessage(musicQueue.textChannel.guild)
      })
      .on('finishSong', async musicQueue => {
        const guild = musicQueue.textChannel.guild
        if (!this.musicPlayerMap[guild.id]) return
        if (musicQueue.songs.length <= 1 && !musicQueue.stopped) {
          await this.setPlayerEmbedState(guild.id, PLAYER_STATES.waiting)
          await this.pushChangesToPlayerMessage(guild)
        }
      })
      .on('empty', queue => queue.textChannel.send('Все ушли от меня, значит я тоже ухожу.'))

    this.playerEmitter
      .on(AudioPlayerEvents.responseSongSkip, async (guild, song, username) => {
        const queue = this.distube.getQueue(guild)
        queue.textChannel.send({ content: `:fast_forward: ${username} пропустил(-а) песню ${song.name} - ${song.uploader.name} :fast_forward:` })
      })
      .on(AudioPlayerEvents.responseQueueShuffle, async (guild, username) => {
        const messageWithPlayer = await this.getPlayerMessageInGuild(guild)
        await messageWithPlayer.channel.send(`${username} перемешал(-а) все песни`)
      })
      .on(AudioPlayerEvents.responseDeleteSong, async (guild, song, username) => {
        const queue = this.distube.getQueue(guild)
        const messageWithPlayer = await this.getPlayerMessageInGuild(guild)
        if (!messageWithPlayer) return
        await messageWithPlayer.channel.send({ content: `${username} удалил(-а) песню из очереди ${song.name} - ${song.uploader.name}` })

        this.editField(queue.textChannel.guild.id, PLAYER_FIELDS.remaining_songs, (queue.songs.length - 1).toString())
        await messageWithPlayer.edit({ embeds: [this.musicPlayerMap[queue.textChannel.guild.id].PlayerEmbed] })
      })
      .on(AudioPlayerEvents.responsePlayerResume, async (guild) => {
        const messageWithPlayer = await this.getPlayerMessageInGuild(guild)
        await this.setPlayerEmbedState(messageWithPlayer.guild.id, PLAYER_STATES.playing)
        await messageWithPlayer.edit({ embeds: [this.musicPlayerMap[messageWithPlayer.guild.id].PlayerEmbed] })
      })
      .on(AudioPlayerEvents.responsePlayerPause, async (guild) => {
        const messageWithPlayer = await this.getPlayerMessageInGuild(guild)
        await this.setPlayerEmbedState(messageWithPlayer.guild.id, PLAYER_STATES.paused)
        await messageWithPlayer.edit({ embeds: [this.musicPlayerMap[messageWithPlayer.guild.id].PlayerEmbed] })
      })
      .on(AudioPlayerEvents.responseToggleRepeatMode, async (guild, repeatMode) => {
        const messageWithPlayer = await this.getPlayerMessageInGuild(guild)
        let modeString
        switch (repeatMode) {
          case RepeatMode.DISABLED:
            modeString = 'Выключен'
            break
          case RepeatMode.SONG:
            modeString = 'Песня'
            break
          case RepeatMode.QUEUE:
            modeString = 'Очередь'
            break
        }
        this.editField(guild.id, PLAYER_FIELDS.repeat_mode, modeString)
        await messageWithPlayer.edit({ embeds: [this.musicPlayerMap[guild.id].PlayerEmbed] })
        await this.pushChangesToPlayerMessage(guild)
      })
      .on(AudioPlayerEvents.responseQueueJump, async (guild, position, username) => {
        if (username) {
          await this.getPlayerMessageInGuild(guild).then(async (playerMessage) => {
            if (position >= 1) { await playerMessage.channel.send(`:fast_forward: ${username} совершил(-а) прыжок ВПЕРЁД в очереди, пропустив предыдущие песни :fast_forward:`); return }
            if (position <= 0) { await playerMessage.channel.send(`:rewind: ${username} совершил(-а) прыжок НАЗАД в очереди, вернувшись на уже проигранные песни :rewind:`) }
          })
        }
      })
      .on(AudioPlayerEvents.responseChangeSongTime, async (guild, time, username) => {
        const channel = this.distube.getQueue(guild).textChannel
        if (username) {
          channel.send({ content: `${username} перемотал(-а) время на ${secondsToFormattedTime(time)}` })
        }
      })
      .on(AudioPlayerEvents.responseFinishCooldown, async (guild) => {
        // loggerSend('responseFinishCD')
        const playerMessage = await this.getPlayerMessageInGuild(guild)
        playerMessage.channel.send({ content: 'Время ожидания истекло, я выключаю плеер' })
      })
  }

  /**
   * Создаёт сообщение с плеером и отправляет его в чат
   * @param queue
   */
  async createPlayer (queue) {
    await this.deletePlayerMessage(queue.textChannel.guild)
    const Player = this.createPlayerEmbed(queue.textChannel.guild.id)

    const guildId = queue.textChannel.guild.id

    const musicPlayerMessage = await queue.textChannel.send(Player) // Отправляем сообщение с плеером

    const filter = button => button.customId

    delete this.musicPlayerMap[guildId]
    this.musicPlayerMap[guildId] = {
      MessageID: musicPlayerMessage.id,
      ChannelID: musicPlayerMessage.channel.id,
      PlayerEmbed: Player.embeds[0],
      Collector: musicPlayerMessage.channel.createMessageComponentCollector({ filter })
    }

    const collector = this.musicPlayerMap[guildId].Collector

    collector.on('collect', async button => {
      try {
        if (!await checkMemberInVoiceWithBotAndReply(button.member, button)) { return }

        if (button.customId === 'stop_music') {
          this.playerEmitter.emit(AudioPlayerEvents.requestStopPlayer, button.guild)
          await button.message.channel.send({ content: `${button.user.username} выключил плеер` })

          return
        }

        if (!this.distube.getQueue(button.guild)) {
          await button.reply({ content: 'Плеер в режиме ожидания, ничего кроме полного выключения (красной кнопки) не работает', ephemeral: true })

          return
        }

        if (button.customId === 'show_queue') {
          const showQueue = this.distube.getQueue(button.guild)

          let queueList = ''

          let song = ''
          for (let i = 1; i < Math.min(31, showQueue.songs.length); i++) {
            song = showQueue.songs[i]
            queueList += `${i + 1}. ` + `[${song.name}](${song.url})` + ` - \`${song.formattedDuration}\`\n`
          }

          if (showQueue.songs.length > 32) {
            queueList += `И ещё ${showQueue.songs.length - 33} песни ждут своего часа`
          }

          const queueEmbed = new EmbedBuilder()
            .setAuthor({ name: 'Сейчас играет: ' })
            .setTitle('1. ' + showQueue.songs[0].name).setURL(showQueue.songs[0].url)
            .setDescription(`**Оставшиеся песни: **\n${queueList}`.slice(0, 4096))
          await button.reply({ embeds: [queueEmbed], ephemeral: true })

          return
        }

        if (button.customId === 'download_song') {
          await this.extractAudioToMessage(button, this.distube.getQueue(queue.textChannel.guild).songs[0])
          return
        }

        if (button.customId === 'pause_music') {
          this.playerEmitter.emit(AudioPlayerEvents.requestTogglePauseAndResume, button.guild)
          await button.deferUpdate()

          return
        }

        if (button.customId === 'toggle_repeat') {
          this.playerEmitter.emit(AudioPlayerEvents.requestToggleRepeatMode, button.guild)
          await button.deferUpdate()

          return
        }

        if (button.customId === 'skip_song') {
          this.playerEmitter.emit(AudioPlayerEvents.requestSongSkip, button.guild, button.user.username)
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

  async deletePlayerMessage (guild) {
    if (!this.musicPlayerMap[guild.id]) return

    await this.musicPlayerMap[guild.id].Collector.stop()
    const playerMessage = await this.getPlayerMessageInGuild(guild)
    // loggerSend(`DeletePlayerMessage + ${JSON.stringify(playerMessage)}`)
    if (playerMessage !== undefined) {
      await playerMessage.delete()
    }
  }

  /**
   * Редактирует значения поля в плеере, но не отправляет изменения в сообщение в Discord
   *
   * @param guildID
   * @param field - PLAYERFIELDS
   * @param value
   */
  editField (guildID, field, value) {
    this.musicPlayerMap[guildID].PlayerEmbed.data.fields[field].value = value || 'Неизвестно'
  }

  /**
   * Возвращает сообщение с плеером из Discord
   *
   * @param guild
   */
  async getPlayerMessageInGuild (guild) {
    const guildId = guild.id
    const channel = await this.client.channels.cache.get(this.musicPlayerMap[guildId]?.ChannelID)
    if (!channel) return undefined

    // loggerSend(`getPlayerMessageInGuild ${this.musicPlayerMap[guildId]?.MessageID}`)
    const message = await channel.messages.fetch(this.musicPlayerMap[guildId]?.MessageID)

    if (message) {
      try {
        const finalMessage = await message.fetch(true)

        if (finalMessage) return finalMessage
      } catch (e) {

      }
    }

    return undefined
  }

  /**
   * Проверяет отправлено ли сообщение там же, где был создан плеер.
   * Если плеера нет, возвращает true
   * @param interaction
   */
  async isChannelWithPlayer (interaction) {
    const channelId = this.musicPlayerMap[interaction.guildId]?.ChannelID
    if (!channelId) {
      return true
    }

    // loggerSend(`IsChannelWithPlayer - InteractionChannelID ${interaction.channel.id} playerChannelId ${channelId}`)

    if (interaction.channel.id === channelId) {
      return true
    } else {
      const channel = await this.client.channels.fetch(channelId)
      if (channel) {
        await interaction.reply({ content: `Плеер бота запущен на текстовом канале **#${channel.name}**, поэтому музыкальные команды работают только там.`, ephemeral: true })
      }

      return false
    }
  }

  /**
   * Меняет состояние плеера (цвет, текст), но не отправляет изменения в сообщение в Discord
   *
   * @param guildID
   * @param state - waiting || playing || paused
   */
  async setPlayerEmbedState (guildID, state) {
    if (!this.musicPlayerMap[guildID].PlayerEmbed) return
    switch (state) {
      case PLAYER_STATES.waiting:
        await this.musicPlayerMap[guildID].PlayerEmbed.setTitle(null).setURL(null).setAuthor({ name: '💿 Ожидание 💿' }).setColor('#43f7f7').setThumbnail(null)
        for (const playerField in PLAYER_FIELDS) { // Проходим по всем полям в плеере и назначаем неопределённое значение
          this.editField(guildID, PLAYER_FIELDS[playerField], undefined)
        }
        break

      case PLAYER_STATES.playing:
        await this.musicPlayerMap[guildID].PlayerEmbed.setAuthor({ name: '▶️ Играет ▶️' }).setColor('#49f743')
        break

      case PLAYER_STATES.paused:
        await this.musicPlayerMap[guildID].PlayerEmbed.setAuthor({ name: '⏸️ Пауза ⏸️ ' }).setColor('#f74343')
        break
    }
  }

  /**
   * Восстанавливает плеер если сообщение с ним не было найдено
   * @param guild
   * @param queue
   */
  async restorePlayerMessage (guild, queue) {
    if (this.musicPlayerMap[guild.id]) {
      try {
        const messagePlayer = await this.getPlayerMessageInGuild(guild)
        if (messagePlayer === undefined) {
          await this.playerEmitter.emit('destroyPlayer', guild)
        }
      } catch (e) {

      }
    }
    await this.createPlayer(queue)
  }

  /**
   * Применяет все изменения сделанные с полями плеера к сообщению в Discord
   * @returns {Promise<void>}
   * @param guild
   */
  async pushChangesToPlayerMessage (guild) {
    try {
      const player = this.musicPlayerMap[guild.id]
      if (!player) return
      const channel = await this.client.channels.cache.get(player.ChannelID)

      if (channel) {
        const message = await channel.messages.fetch(player.MessageID)

        if (message) {
          try {
            const finalMessage = await message.fetch(true)

            if (finalMessage) return await finalMessage.edit({ embeds: [player.PlayerEmbed] })
          } catch (e) {

          }
        }
      }
    } catch (e) {
      loggerSend(e)
    }
  }

  /**
   * Изменяет песню, отображаемую в плеере
   * @param queue
   * @param song
   */
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

    let modeString
    switch (queue.repeatMode) {
      case RepeatMode.DISABLED:
        modeString = 'Выключен'
        break
      case RepeatMode.SONG:
        modeString = 'Песня'
        break
      case RepeatMode.QUEUE:
        modeString = 'Очередь'
        break
    }
    this.editField(guild, PLAYER_FIELDS.repeat_mode, modeString)

    this.editField(guild, PLAYER_FIELDS.remaining_songs, (queue.songs.length - 1).toString())
    this.editField(guild, PLAYER_FIELDS.next_song, queue.songs[1]?.name || 'Дальше пусто')
    await this.musicPlayerMap[guild].PlayerEmbed.setThumbnail(song.thumbnail).setTitle(song.name).setURL(song.url)
  }

  /**
   * Создаёт embed сообщение с интерфейсом Аудио Плеера, но не отправляет его.
   */
  createPlayerEmbed (guildId) {
    const musicPlayerEmbed = new EmbedBuilder()// Создаём сообщение с плеером
      .setColor('#f7ee43')
      .setAuthor({ name: '⌛ Загрузка ⌛' })
      .addFields(
        { name: 'Автор', value: 'Неизвестно' },
        { name: 'Длительность песни', value: 'Неизвестно', inline: false },
        { name: 'Оставшаяся длительность очереди', value: 'Неизвестно', inline: false },
        { name: 'Следующая песня', value: 'Дальше пусто', inline: false },
        { name: 'Осталось песен в очереди', value: 'Неизвестно', inline: true },
        { name: 'Режим повтора', value: 'Выключен', inline: true },
        { name: 'Эту песню запросил', value: 'Неизвестно', inline: true }
      )

    const musicPlayerRowPrimary = new ActionRowBuilder()// Создаём кнопки для плеера
      .addComponents(
        new ButtonBuilder().setCustomId('stop_music').setStyle(ButtonStyle.Danger).setEmoji('<:stopwhite:1014551716043173989>'),
        new ButtonBuilder().setCustomId('pause_music').setStyle(ButtonStyle.Primary).setEmoji('<:pausewhite:1014551696174764133>'),
        new ButtonBuilder().setCustomId('toggle_repeat').setStyle(ButtonStyle.Primary).setEmoji('<:repeatmodewhite:1014551751858331731>'),
        new ButtonBuilder().setCustomId('skip_song').setStyle(ButtonStyle.Primary).setEmoji('<:skipwhite:1014551792484372510>')
      )

    const musicPlayerRowSecondary = new ActionRowBuilder()// Создаём кнопки для плеера
      .addComponents(
        new ButtonBuilder().setCustomId('show_queue').setStyle(ButtonStyle.Secondary).setEmoji('<:songlistwhite:1014551771705782405>'),
        new ButtonBuilder().setCustomId('download_song').setStyle(ButtonStyle.Success).setEmoji('<:downloadwhite:1014553027614617650>')
      )

    if (process.env.BOT_DASHBOARD_ENABLE === '1') {
      const link = `${process.env.BOT_DASHBOARD_URL}/app/${guildId}/audioplayer`
      musicPlayerRowSecondary.addComponents(new ButtonBuilder().setLabel('Полная версия').setStyle(ButtonStyle.Link).setURL(link))
    }
    // Возвращаем сообщение которое можно отправить в Discord
    return { embeds: [musicPlayerEmbed], components: [musicPlayerRowPrimary, musicPlayerRowSecondary] }
  }

  /**
   * Ищет и отправляет аудиофайл в чат
   * @param interaction
   * @param song
   */
  async extractAudioToMessage (interaction, song) {
    await interaction.reply({ content: `${interaction.user.username} ожидайте...` })

    const downloadData = await downloadSong(song)
    switch (downloadData) {
      case 'songIsTooLarge':
        await interaction.editReply({
          content: 'Я не могу отправить файл, так как он весит больше чем 8мб.',
          ephemeral: true
        })
        break
      case 'songIsLive':
        await interaction.editReply({ content: 'Это прямая трансляция, её нельзя скачать!', ephemeral: true })
        break
      case 'undefinedError':
        await interaction.editReply({ content: 'Произошла непредвиденная ошибка', ephemeral: true })
        break
      default:
        await interaction.channel.send({
          content: `${interaction.user.username} я смог извлечь звук`,
          files: [downloadData]
        })
        await deleteSongFile(downloadData)
    }
  }
}

module.exports = { DiscordGui: AudioPlayerDiscordGui }
