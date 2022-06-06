const { client, AudioPlayer } = require('../../main')

class AudioPlayerSocketHandler {
  constructor (serverSocketIO) {
    this.io = serverSocketIO
    AudioPlayer.distube.setMaxListeners(2)
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
    AudioPlayer.distube.on('pause', async (musicQueue) => {
      this.sendPauseState(musicQueue.textChannel.guild.id)
    })
    AudioPlayer.distube.on('resume', async (musicQueue) => {
      this.sendPauseState(musicQueue.textChannel.guild.id, false)
    })
    AudioPlayer.distube.on('repeatChanged', async (musicQueue) => {
      this.sendRepeatState(musicQueue.textChannel.guild.id)
    })
    AudioPlayer.distube.on('shuffleQueue', async (musicQueue) => {
      this.sendPlaylistState(musicQueue.textChannel.guild.id)
    })
    AudioPlayer.distube.on('songDeleted', async (musicQueue) => {
      this.sendPlaylistState(musicQueue.textChannel.guild.id)
    })

    this.setEvents = (socket) => {
      socket.on('joinAudioPlayer', guildId => {
        socket.request.session.reload(() => {
          socket.rooms.forEach((room) => {
            socket.leave(room)
          })
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
        this.sendPlaylistState(guildId)
        this.sendPauseState(guildId)
      })

      socket.on('requestCurrentDuration', guildId => {
        this.sendCurrentDuration(guildId)
      })

      socket.on('changeCurrentDuration', async (guildId, duration) => {
        if (!await checkRequirements(socket, guildId)) return
        await this.setCurrentDuration(guildId, duration)
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
    const playlist = []
    const guildDiscord = client.guilds.cache.get(guildId)
    if (guildDiscord) {
      const queue = AudioPlayer.getQueue(guildDiscord)
      if (queue) {
        queue.songs.forEach((song) => {
          playlist.push({
            title: song.name,
            author: song.uploader.name,
            requester: song.user.username,
            duration: song.duration,
            img: song.thumbnail,
            url: song.url
          })
        })
      }
    }

    this.io.to(guildId).emit('responsePlaylist', playlist)
  }

  sendCurrentDuration (guildId) {
    const guildDiscord = client.guilds.cache.get(guildId)
    if (!guildDiscord) return
    const queue = AudioPlayer.getQueue(guildDiscord)
    if (!queue) return
    this.io.to(guildId).emit('responseCurrentDuration', Math.round(queue.currentTime))
  }

  async setCurrentDuration (guildId, duration) {
    const guildDiscord = client.guilds.cache.get(guildId)
    if (!guildDiscord) return
    const message = await AudioPlayer.getPlayerMessageInGuild(guildDiscord)
    if (!message) return
    const queue = AudioPlayer.distube.getQueue(guildDiscord)
    await AudioPlayer.distube.seek(queue, duration)
    await AudioPlayer.resume(message)
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
    const message = await AudioPlayer.getPlayerMessageInGuild(guildDiscord)
    if (!message) return

    await AudioPlayer.pause(message)
  }

  async setNextSong (guildId, username) {
    const guildDiscord = client.guilds.cache.get(guildId)
    if (!guildDiscord) return
    const queue = AudioPlayer.getQueue(guildDiscord)

    const message = await AudioPlayer.getPlayerMessageInGuild(guildDiscord)
    if (!message) return
    await AudioPlayer.skipSong(queue, message, username)
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
    const message = await AudioPlayer.getPlayerMessageInGuild(guildDiscord)
    if (!message) return

    await AudioPlayer.changeRepeatMode(message)
  }

  async setShuffle (guildId, username) {
    const guildDiscord = client.guilds.cache.get(guildId)
    if (!guildDiscord) return
    const message = await AudioPlayer.getPlayerMessageInGuild(guildDiscord)
    if (!message) return
    await AudioPlayer.shuffle(message, username)
  }

  async jumpToSong (guildId, position, userName) {
    const guildDiscord = client.guilds.cache.get(guildId)
    if (!guildDiscord) return
    await AudioPlayer.jump(guildDiscord, position, null, userName)
  }

  async deleteSong (guildId, position, username) {
    const guildDiscord = client.guilds.cache.get(guildId)
    if (!guildDiscord) return
    await AudioPlayer.deleteSongFromQueue(guildDiscord, position, username)
  }
}

async function checkRequirements (socket, guildId) {
  const guild = client.guilds.cache.get(guildId)
  if (!guild) return false
  const memberDiscord = guild.members.cache.get(socket.request.session.user.detail.id)
  if (!memberDiscord) return false
  return await AudioPlayer.checkUserInVoice(memberDiscord)
}

module.exports = { AudioPlayerSocketHandler }
