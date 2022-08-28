const voice = require('@discordjs/voice')
const { checkMemberInVoiceWithBotAndReply, checkMemberInVoiceWithReply } = require('../../utilities/checkMemberInVoiceWithBot')
const { clamp } = require('../../utilities/clamp')
const { getVoiceConnection } = require('@discordjs/voice')

class AudioPlayerActions {
  constructor (musicPlayerMap, distube, playerEmitter, client) {
    this.musicPlayerMap = musicPlayerMap
    this.distube = distube
    this.playerEmitter = playerEmitter
    this.client = client
  }

  /**
   * Начинает проигрывать аудио и запускать плеер на сервере где было отправлено сообщение
   * @param interaction
   */
  async play (interaction) {
    const connection = getVoiceConnection(interaction.member.guild.id)
    if (!connection) { // Если бот никуда не подключён, то проверяем находится ли человек запросивший команду хоть где-то
      if (!await checkMemberInVoiceWithReply(interaction.member, interaction)) return
    } else {
      if (!await checkMemberInVoiceWithBotAndReply(interaction.member, interaction)) return
    }

    let userSearch = ''// Эта переменная становится запросом который дал пользователь, ссылка (трек или плейлист), прикреплённый файл или любая белеберда будет работать как поиск

    const request = interaction.options.getString('request', false)
    const musicFile = interaction.options.getAttachment('file', false)

    if (musicFile !== null) { // Если к сообщению прикреплены аудиофайлы
      userSearch = musicFile.attachment// Берём ссылку из Discord CDN на файл
      if (!userSearch.endsWith('.mp3') && !userSearch.endsWith('.wav') && !userSearch.endsWith('.ogg')) {
        await interaction.reply({ content: 'Это не аудиофайл, это чёрт пойми что!', ephemeral: true })
        return
      }
    } else if (!request || request.length === 0 || request === '') {
      await interaction.reply({ content: 'Запрос слишком короткий.', ephemeral: true })
      return
    } else {
      userSearch = request
    }

    interaction.reply({ content: 'Обработка запроса' })

    const txtChannel = this.client.channels.cache.get(interaction.channelId)
    await this.distube.play(interaction.member.voice.channel, userSearch, {
      member: interaction.member,
      textChannel: txtChannel
    })

    interaction.deleteReply()
  }

  /**
   * Пропускает текущую проигрываемую песню
   * @param queue
   */
  async skipSong (queue) {
    if (queue.songs.length > 1) {
      await this.distube.skip(queue)
      await this.resume(queue.guild)
    }
  }

  /**
   * Меняет режим повтора очереди (Выключен, Песня, Вся очередь), вызывает событие repeatChanged у distube
   * @param guild
   */
  async changeRepeatMode (guild) {
    const queue = this.distube.getQueue(guild)
    if (queue) {
      const repeat = queue.repeatMode
      switch (repeat) {
        case 0:
          queue.setRepeatMode(1)
          break
        case 1:
          queue.setRepeatMode(2)
          break
        case 2:
          queue.setRepeatMode(0)
          break
      }
    }

    this.playerEmitter.emit('switchRepeatMode', guild, queue.repeatMode)
  }

  /**
   * Переключает режим паузы и проигрывания
   * @param guild
   */
  async switchPauseAndResume (guild) {
    const queue = this.distube.getQueue(guild)
    if (queue.paused) {
      this.playerEmitter.emit('playerResume', guild)
    } else {
      this.playerEmitter.emit('playerPause', guild)
    }
  }

  /**
   * Ставит воспроизведение на паузу
   * @param guild
   */
  async pause (guild) {
    await this.distube.pause(guild)
  }

  /**
   * Возобновляет воспроизведение аудио
   * @param guild
   */
  async resume (guild) {
    try {
      await this.distube.resume(guild)
    } catch (e) {

    }
  }

  /**
   * Полностью останавливает работу плеера
   * @param guild
   */
  async stop (guild) {
    const vc = voice.getVoiceConnection(guild.id, guild.client.user?.id)
    if (vc) {
      await vc.destroy()
    }
    await this.playerEmitter.emit('destroyPlayer', guild)
  }

  /**
   * Перемотка сразу на выбранную песню в очереди
   * @param guild
   * @param queuePosition
   */
  async jump (guild, queuePosition) {
    const queue = this.distube.getQueue(guild)
    await this.resume(guild)

    queuePosition = clamp(parseInt(queuePosition), 0 - queue.previousSongs.length, queue.songs.length - 1)
    try {
      await this.distube.jump(guild, queuePosition)
    } catch (e) {

    }
  }

  /**
   * Перемотка на предыдущую песню
   * @param guild
   * @param message
   * @param username
   */
  async previousSong (guild, message, username) {
    await this.jump(guild, -1, message, username)
  }

  /**
   * Перемешать все песни в очереди, при этом текущая проигрываемая песня перемешиваться не будет.
   * @param message
   */
  async shuffle (message) {
    const queue = this.distube.getQueue(message)
    if (queue) {
      await this.distube.shuffle(queue)
    }
  }

  /**
   * Удаляет выбранную песню из очереди
   * @param guild
   * @param position
   * @param username
   */
  async deleteSongFromQueue (guild, position, username) {
    const queue = this.distube.getQueue(guild)
    if (!queue) return
    position = clamp(position, 0 - queue.previousSongs.length, queue.songs.length - 1)
    if (position > 0) {
      this.playerEmitter.emit('queueDeleteSong', guild, queue.songs[position], username)
      queue.songs.splice(position, 1)
    } else if (position < 0) {
      position = queue.previousSongs.length - Math.abs(position)
      this.playerEmitter.emit('queueDeleteSong', guild, queue.previousSongs[position], username)
      queue.previousSongs.splice(position, 1)
    }
  }

  /**
   * Меняет время с которого проигрывается песня
   * @param message
   * @param queryArgs
   */
  async position (message = null, queryArgs) {
    const queue = this.distube.getQueue(message)

    if (!queue) { message?.channel.send('Очереди не существует'); return }

    if (queue.songs[0].isLive) {
      message?.reply({ content: 'Нельзя перематывать прямые трансляции' })
      return
    }

    if (!queryArgs) { message?.reply({ content: 'А время указать? Не понимаешь как? Пиши /help position' }); return }

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
}

module.exports = { AudioPlayerActions }
