const voice = require('@discordjs/voice')
const { checkMemberInVoiceWithBotAndReply, checkMemberInVoiceWithReply } = require('../../utilities/checkMemberInVoiceWithBot')
const { clamp } = require('../../utilities/clamp')
const { getVoiceConnection } = require('@discordjs/voice')
const { RepeatMode } = require('distube')
const { AudioPlayerEvents } = require('./AudioPlayerEvents')

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
    const connection = getVoiceConnection(interaction.member.guild.id, interaction.guild.client.user?.id)
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

    try {
      const txtChannel = this.client.channels.cache.get(interaction.channelId)
      await this.distube.play(interaction.member.voice.channel, userSearch, {
        member: interaction.member,
        textChannel: txtChannel
      })

      interaction.deleteReply()
    } catch (e) {
      // loggerSend(e)

      interaction.editReply({ content: 'С этой песней произошла ошибка, попробуйте ещё раз. Возможно она находится на неподдерживаемом сервисе или в приватном плейлисте.' })
    }
  }

  /**
   * Пропускает текущую проигрываемую песню
   * @param guild
   * @param username
   */
  async skipSong (guild, username) {
    const queue = this.distube.getQueue(guild)
    if (queue.songs.length > 1) {
      const song = queue.songs[0]
      await this.distube.skip(queue)
      await this.resume(guild)
      this.playerEmitter.emit(AudioPlayerEvents.responseSongSkip, guild, song, username)
    }
  }

  /**
   * Меняет режим повтора очереди (Выключен, Песня, Вся очередь)
   * @param guild
   */
  async changeRepeatMode (guild) {
    const queue = this.distube.getQueue(guild)
    if (queue) {
      const repeat = queue.repeatMode
      switch (repeat) {
        case RepeatMode.DISABLED:
          await queue.setRepeatMode(RepeatMode.SONG)
          break
        case RepeatMode.SONG:
          await queue.setRepeatMode(RepeatMode.QUEUE)
          break
        case RepeatMode.QUEUE:
          await queue.setRepeatMode(RepeatMode.DISABLED)
          break
      }
    }

    this.playerEmitter.emit(AudioPlayerEvents.responseToggleRepeatMode, guild, queue.repeatMode)
  }

  /**
   * Переключает режим паузы и проигрывания
   * @param guild
   */
  async switchPauseAndResume (guild) {
    const queue = this.distube.getQueue(guild)
    if (queue.paused) {
      this.playerEmitter.emit(AudioPlayerEvents.requestPlayerResume, guild)
    } else {
      this.playerEmitter.emit(AudioPlayerEvents.requestPlayerPause, guild)
    }
  }

  /**
   * Ставит воспроизведение на паузу
   * @param guild
   */
  async pause (guild) {
    const queue = this.distube.getQueue(guild)
    if (!queue.paused) {
      await this.distube.pause(guild)
      this.playerEmitter.emit(AudioPlayerEvents.responsePlayerPause, guild)
    }
  }

  /**
   * Возобновляет воспроизведение аудио
   * @param guild
   */
  async resume (guild) {
    const queue = this.distube.getQueue(guild)
    if (queue.paused) {
      await this.distube.resume(guild)
      this.playerEmitter.emit(AudioPlayerEvents.responsePlayerResume, guild)
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
    await this.playerEmitter.emit(AudioPlayerEvents._destroyPlayer, guild)
  }

  /**
   * Перемотка сразу на выбранную песню в очереди
   * @param guild
   * @param queuePosition
   * @param username
   */
  async jump (guild, queuePosition, username) {
    const queue = this.distube.getQueue(guild)
    await this.playerEmitter.emit(AudioPlayerEvents.requestPlayerResume, guild)

    queuePosition = clamp(parseInt(queuePosition), 0 - queue.previousSongs.length, queue.songs.length - 1)
    try {
      await this.distube.jump(guild, queuePosition)
      this.playerEmitter.emit(AudioPlayerEvents.responseQueueJump, guild, queuePosition, username)
    } catch (e) {

    }
  }

  /**
   * Перемешать все песни в очереди, при этом текущая проигрываемая песня перемешиваться не будет.
   * @param guild
   * @param username
   */
  async shuffle (guild, username) {
    const queue = this.distube.getQueue(guild)
    if (queue) {
      await this.distube.shuffle(queue)
      this.playerEmitter.emit(AudioPlayerEvents.responseQueueShuffle, guild, username)
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
      const song = queue.songs[position]
      queue.songs.splice(position, 1)
      this.playerEmitter.emit(AudioPlayerEvents.responseDeleteSong, guild, song, username)
    } else if (position < 0) {
      position = queue.previousSongs.length - Math.abs(position)
      const song = queue.previousSongs[position]
      queue.previousSongs.splice(position, 1)
      this.playerEmitter.emit(AudioPlayerEvents.responseDeleteSong, guild, song, username)
    }
  }

  /**
   * Меняет время с которого проигрывается песня
   * @param guild
   * @param seconds
   * @param username
   */
  async position (guild, seconds, username) {
    const queue = this.distube.getQueue(guild)
    await this.distube.seek(queue, seconds)

    this.playerEmitter.emit(AudioPlayerEvents.responseChangeSongTime, guild, seconds, username)
  }
}

module.exports = { AudioPlayerActions }
