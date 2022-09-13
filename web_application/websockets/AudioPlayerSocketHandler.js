const { client, AudioPlayer } = require('../../main')
const { checkMemberInVoiceWithBot } = require('../../utilities/checkMemberInVoiceWithBot')
const { AudioPlayerEvents } = require('../../custom_modules/Audioplayer/AudioPlayerEvents')

class AudioPlayerSocketHandler {
  constructor (serverSocketIO) {
    this.io = serverSocketIO
    // События Distub`a
    AudioPlayer.distube.on('playSong', async (musicQueue) => {
      this.sendPlaylistState(musicQueue.textChannel.guild.id)
    })
    AudioPlayer.distube.on('finishSong', async (musicQueue) => {
      this.sendPlaylistState(musicQueue.textChannel.guild.id)
    })
    AudioPlayer.distube.on('disconnect', async (musicQueue) => {
      this.sendPlaylistState(musicQueue.textChannel.guild.id)
      this.io.to(musicQueue.textChannel.guild.id).emit('responseCurrentDuration', 0)
    })
    AudioPlayer.distube.on('addList', async (musicQueue) => {
      this.sendPlaylistState(musicQueue.textChannel.guild.id)
    })
    AudioPlayer.distube.on('addSong', async (musicQueue) => {
      this.sendPlaylistState(musicQueue.textChannel.guild.id)
    })
    // События кастомного плеера
    AudioPlayer.playerEmitter.on(AudioPlayerEvents.responsePlayerPause, async (guild) => {
      this.sendPauseState(guild.id)
    })
    AudioPlayer.playerEmitter.on(AudioPlayerEvents.responsePlayerResume, async (guild) => {
      this.sendPauseState(guild.id, false)
    })
    AudioPlayer.playerEmitter.on(AudioPlayerEvents.responseToggleRepeatMode, async (guild) => {
      this.sendRepeatState(guild.id)
    })
    AudioPlayer.playerEmitter.on(AudioPlayerEvents.responseQueueShuffle, async (guild) => {
      this.sendPlaylistState(guild.id)
    })
    AudioPlayer.playerEmitter.on(AudioPlayerEvents.responseDeleteSong, async (guild) => {
      this.sendPlaylistState(guild.id)
    })

    this.setEvents = (socket) => {
      socket.on('joinAudioPlayer', guildId => {
        socket.request.session.reload(() => {
          // Отключаем пользователя от всех комнат
          socket.rooms.forEach((room) => {
            socket.leave(room)
          })
          // Подключаем пользователя к нужной
          const guilds = socket.request.session.guilds
          if (guilds) {
            if (guilds.some(guild => guild.id === guildId)) {
              socket.join(guildId)
              this.sendPlayerState(guildId)
            }
          }
        })
      })

      socket.on('requestPlaylist', guildId => {
        this.sendPlayerState(guildId)
      })

      socket.on('requestCurrentDuration', guildId => {
        this.sendCurrentDuration(guildId)
      })

      socket.on('changeCurrentDuration', async (guildId, duration) => {
        if (!await checkRequirements(socket, guildId)) return
        await this.setCurrentDuration(guildId, Math.round(duration), socket.request.session.user.detail.username)
      })

      socket.on('changePauseState', async (guildId) => {
        if (!await checkRequirements(socket, guildId)) return
        await this.setPauseState(guildId)
      })

      socket.on('requestPauseState', guildId => {
        this.sendPauseState(guildId)
      })

      socket.on('nextSong', async (guildId) => {
        if (!await checkRequirements(socket, guildId)) return
        await this.setNextSong(guildId, socket.request.session.user.detail.username)
      })

      socket.on('previousSong', async (guildId) => {
        if (!await checkRequirements(socket, guildId)) return
        await this.setPreviousSong(guildId, socket.request.session.user.detail.username)
      })

      socket.on('requestRepeatState', guildId => {
        this.sendRepeatState(guildId)
      })

      socket.on('changeRepeatState', async guildId => {
        if (!await checkRequirements(socket, guildId)) return
        await this.setRepeatState(guildId)
      })

      socket.on('shuffleQueue', async (guildId, username) => {
        if (!await checkRequirements(socket, guildId)) return
        await this.setShuffle(guildId, username)
      })

      socket.on('jumpToSong', async (guildId, position) => {
        if (!await checkRequirements(socket, guildId)) return
        await this.jumpToSong(guildId, position, socket.request.session.user.detail.username)
      })

      socket.on('deleteSong', async (guildId, position) => {
        if (!await checkRequirements(socket, guildId)) return
        await this.deleteSong(guildId, position, socket.request.session.user.detail.username)
      })
    }
  }

  sendPlayerState (guildId) {
    this.sendPlaylistState(guildId)
    this.sendPauseState(guildId)
    this.sendRepeatState(guildId)
    this.sendCurrentDuration(guildId)
  }

  sendPlaylistState (guildId) {
    const playlist = { queued: [], played: [] }
    const guildDiscord = client.guilds.cache.get(guildId)
    if (guildDiscord) {
      const queue = AudioPlayer.getQueue(guildDiscord)
      if (queue) {
        queue.songs.forEach((song, index) => {
          playlist.queued.push({
            title: song.name,
            author: song.uploader.name,
            requester: song.user.username,
            duration: song.duration,
            img: song.thumbnail,
            url: song.url,
            position: index
          })
        })
        queue.previousSongs.forEach((song, index) => {
          playlist.played.push({
            title: song.name,
            author: song.uploader.name,
            requester: song.user.username,
            duration: song.duration,
            img: song.thumbnail,
            url: song.url,
            position: -Math.abs(queue.previousSongs.length - index)
          })
        })
      }

      this.io.to(guildId).emit('responsePlaylist', playlist)
    }
  }

  sendCurrentDuration (guildId) {
    const guildDiscord = client.guilds.cache.get(guildId)
    if (!guildDiscord) return
    const queue = AudioPlayer.getQueue(guildDiscord)
    if (!queue) return
    this.io.to(guildId).emit('responseCurrentDuration', Math.round(queue.currentTime))
  }

  async setCurrentDuration (guildId, duration, username) {
    const guildDiscord = client.guilds.cache.get(guildId)
    if (!guildDiscord) return

    AudioPlayer.playerEmitter.emit(AudioPlayerEvents.requestChangeSongTime, guildDiscord, duration, username)
  }

  sendPauseState (guildId, pauseState) {
    const guildDiscord = client.guilds.cache.get(guildId)
    if (!guildDiscord) return

    const queue = AudioPlayer.getQueue(guildDiscord)
    if (!queue) return
    this.io.to(guildId).emit('responsePauseState', pauseState || queue.paused)
  }

  async setPauseState (guildId) {
    const guildDiscord = client.guilds.cache.get(guildId)
    if (!guildDiscord) return
    const message = await AudioPlayer.discordGui.getPlayerMessageInGuild(guildDiscord)
    if (!message) return

    await AudioPlayer.playerEmitter.emit(AudioPlayerEvents.requestTogglePauseAndResume, guildDiscord)
  }

  async setNextSong (guildId, username) {
    const guildDiscord = client.guilds.cache.get(guildId)
    if (!guildDiscord) return

    await AudioPlayer.playerEmitter.emit(AudioPlayerEvents.requestSongSkip, guildDiscord, username)
  }

  async setPreviousSong (guildId, username) {
    const guildDiscord = client.guilds.cache.get(guildId)
    if (!guildDiscord) return

    await AudioPlayer.playerEmitter.emit(AudioPlayerEvents.requestQueueJump, guildDiscord, -1, username)
  }

  sendRepeatState (guildId) {
    const guildDiscord = client.guilds.cache.get(guildId)
    if (!guildDiscord) return

    const queue = AudioPlayer.getQueue(guildDiscord)
    if (!queue) return
    this.io.to(guildId).emit('responseRepeatState', queue.repeatMode)
  }

  async setRepeatState (guildId) {
    const guildDiscord = client.guilds.cache.get(guildId)
    if (!guildDiscord) return

    await AudioPlayer.playerEmitter.emit(AudioPlayerEvents.requestToggleRepeatMode, guildDiscord)
  }

  async setShuffle (guildId, username) {
    const guildDiscord = client.guilds.cache.get(guildId)
    if (!guildDiscord) return

    await AudioPlayer.playerEmitter.emit(AudioPlayerEvents.requestQueueShuffle, guildDiscord, username)
  }

  async jumpToSong (guildId, position, username) {
    const guildDiscord = client.guilds.cache.get(guildId)
    if (!guildDiscord) return

    await AudioPlayer.playerEmitter.emit(AudioPlayerEvents.requestQueueJump, guildDiscord, position, username)
  }

  async deleteSong (guildId, position, username) {
    const guildDiscord = client.guilds.cache.get(guildId)
    if (!guildDiscord) return

    await AudioPlayer.playerEmitter.emit(AudioPlayerEvents.requestDeleteSong, guildDiscord, position, username)
  }
}

async function checkRequirements (socket, guildId) {
  const guild = client.guilds.cache.get(guildId)
  if (!guild) return false
  const memberDiscord = guild.members.cache.get(socket.request.session.user.detail.id)
  if (!memberDiscord) return false
  return await checkMemberInVoiceWithBot(memberDiscord)
}

module.exports = { AudioPlayerSocketHandler }
