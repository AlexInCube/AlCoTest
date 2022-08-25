const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const { PLAYER_FIELDS, PLAYER_STATES } = require('./AudioPlayerEnums')
const { checkMemberInVoiceWithBotAndReply } = require('../../utilities/checkMemberInVoiceWithBot')
const { loggerSend } = require('../../utilities/logger')

class AudioPlayerDiscordGui {
  constructor (musicPlayerMap, distube, playerEmitter, client) {
    this.musicPlayerMap = musicPlayerMap
    this.distube = distube
    this.module = module
    this.playerEmitter = playerEmitter
    this.client = client

    this.setupGuiEvents()
  }

  setupGuiEvents () {
    this.distube
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
      /*
      .on('finishSong', async musicQueue => {
        const guild = musicQueue.textChannel.guildId
        if (!this.musicPlayerMap[guild]) return
        if (!musicQueue.next) {
          await this.setPlayerEmbedState(guild, PLAYER_STATES.waiting)
          await this.pushChangesToPlayerMessage(guild, musicQueue)
        }
      })
       */
      .on('empty', queue => queue.textChannel.send('Все ушли от меня, значит я тоже ухожу.'))

    this.playerEmitter
      .on('songSkipped', async (queue, username) => {
        queue.textChannel.send({ content: `${username} пропустил песню ${queue.songs[0].name} - ${queue.songs[0].uploader.name}` })
      })
      .on('queueShuffle', async (queue, username) => {
        queue.textChannel.send(`${username} перемешал все песни`)
      })
      .on('songDeleted', async (queue, position, username) => {
        const messageWithPlayer = await this.getPlayerMessageInGuild(queue.textChannel.guild)
        if (!messageWithPlayer) return
        if (position > 0) {
          await messageWithPlayer.channel.send({ content: `${username} удалил песню из очереди ${queue.songs[position].name} - ${queue.songs[position].uploader.name}` })
        }
        if (position < 0) {
          await messageWithPlayer.channel.send({ content: `${username} удалил песню из списка прошлых песен ${queue.previousSongs[position].name} - ${queue.previousSongs[position].uploader.name}` })
        }
        this.editField(queue.textChannel.guild.id, PLAYER_FIELDS.remaining_songs, (queue.songs.length - 1).toString())
        await messageWithPlayer.edit({ embeds: [this.musicPlayerMap[queue.textChannel.guild.id].PlayerEmbed] })
      })
      .on('playerResume', async (guild) => {
        const messageWithPlayer = await this.getPlayerMessageInGuild(guild)
        await this.setPlayerEmbedState(messageWithPlayer.guild.id, PLAYER_STATES.playing)
        await messageWithPlayer.edit({ embeds: [this.musicPlayerMap[messageWithPlayer.guild.id].PlayerEmbed] })
      })
      .on('playerPause', async (guild) => {
        const messageWithPlayer = await this.getPlayerMessageInGuild(guild)
        await this.setPlayerEmbedState(messageWithPlayer.guild.id, PLAYER_STATES.paused)
        await messageWithPlayer.edit({ embeds: [this.musicPlayerMap[messageWithPlayer.guild.id].PlayerEmbed] })
      })
  }

  /**
   * Создаёт сообщение с плеером и отправляет его в чат
   * @param queue
   */
  async createPlayer (queue) {
    await this.playerEmitter.emit('destroyPlayer', queue.textChannel.guild)
    const Player = this.createPlayerEmbed()

    const guildId = queue.textChannel.guild.id

    const musicPlayerMessage = await queue.textChannel.send(Player) // Отправляем сообщение с плеером

    const filter = button => button.customId
    this.musicPlayerMap[guildId] = {
      MessageID: musicPlayerMessage.id,
      ChannelID: musicPlayerMessage.channel.id,
      PlayerEmbed: Player.embeds[0],
      Collector: musicPlayerMessage.channel.createMessageComponentCollector({ filter })
    }

    const collector = this.musicPlayerMap[guildId].Collector

    collector.on('collect', async button => {
      try {
        if (button.customId === 'show_queue') {
          const showQueue = this.distube.getQueue(button.guild)
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

            const queueEmbed = new EmbedBuilder()
              .setAuthor({ name: 'Сейчас играет: ' })
              .setTitle('1. ' + showQueue.songs[0].name).setURL(showQueue.songs[0].url)
              .setDescription(`**Оставшиеся песни: **\n${queueList}`.slice(0, 4096))
            await button.reply({ embeds: [queueEmbed], ephemeral: true }
            )
          }

          return
        }

        if (button.customId === 'download_song') {
          const song = this.distube.getQueue(queue.textChannel.guild).songs[0]

          await this.downloadSong(song, button.message, button.user.username)
          return
        }

        if (!await checkMemberInVoiceWithBotAndReply(button.member, button)) { return }

        if (button.customId === 'stop_music') {
          this.playerEmitter.emit('stopPlayer', button.guild)
          await button.message.channel.send({ content: `${button.user.username} выключил плеер` })

          return
        }

        if (button.customId === 'pause_music') {
          this.playerEmitter.emit('playerSwitchPauseAndResume', button.guild)
          await button.deferUpdate()

          return
        }

        if (button.customId === 'toggle_repeat') {
          await this.changeRepeatMode(button.message)
          await button.deferUpdate()

          return
        }

        if (button.customId === 'skip_song') {
          this.playerEmitter.emit('songSkipped', button.guild, button.user.username)
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
   * Возвращает сообщение где, находится плеер в Discord
   *
   * @param guild
   */
  async getPlayerMessageInGuild (guild) {
    const guildId = guild.id
    const channel = await this.client.channels.cache.get(this.musicPlayerMap[guildId]?.ChannelID)
    if (!channel) return undefined
    return channel.messages.cache.get(this.musicPlayerMap[guildId]?.MessageID)
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
        await this.musicPlayerMap[guildID].PlayerEmbed.setAuthor({ name: '🎵 Играет 🎵' }).setColor('#49f743')
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
   * @param guildID
   * @param musicQueue
   * @returns {Promise<void>}
   */
  async pushChangesToPlayerMessage (guildID, musicQueue) {
    try {
      let message
      const channel = await musicQueue.textChannel
      if (channel) {
        message = await channel.messages.cache.get(this.musicPlayerMap[guildID].MessageID)
      }
      if (message) {
        await message.edit({ embeds: [this.musicPlayerMap[guildID].PlayerEmbed] })
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
    this.editField(guild, PLAYER_FIELDS.remaining_songs, (queue.songs.length - 1).toString())
    await this.musicPlayerMap[guild].PlayerEmbed.setThumbnail(song.thumbnail).setTitle(song.name).setURL(song.url)
  }

  /**
   * Создаёт embed сообщение с интерфейсом Аудио Плеера, но не отправляет его.
   */
  createPlayerEmbed () {
    const musicPlayerEmbed = new EmbedBuilder()// Создаём сообщение с плеером
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

    const musicPlayerRowPrimary = new ActionRowBuilder()// Создаём кнопки для плеера
      .addComponents(
        new ButtonBuilder().setCustomId('stop_music').setLabel('Выключить').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('pause_music').setLabel('Пауза / Возобновить').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('toggle_repeat').setLabel('Переключить режим повтора').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('skip_song').setLabel('Пропустить').setStyle(ButtonStyle.Primary)
      )

    const musicPlayerRowSecondary = new ActionRowBuilder()// Создаём кнопки для плеера
      .addComponents(
        new ButtonBuilder().setCustomId('show_queue').setLabel('Показать очередь').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('download_song').setLabel('Скачать песню').setStyle(ButtonStyle.Secondary)
      )

    // Возвращаем сообщение которое можно отправить в Discord
    return { embeds: [musicPlayerEmbed], components: [musicPlayerRowPrimary, musicPlayerRowSecondary] }
  }
}

module.exports = { DiscordGui: AudioPlayerDiscordGui }
