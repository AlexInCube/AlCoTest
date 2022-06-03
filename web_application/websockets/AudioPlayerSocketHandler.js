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
    AudioPlayer.distube.on('repeatChanged', async (musicQueue) => {
      this.sendRepeatState(musicQueue.textChannel.guild.id)
    })
    AudioPlayer.distube.on('shuffleQueue', async (musicQueue) => {
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

      socket.on('changePauseState', (guildId, pause) => {
        this.setPauseState(guildId, pause)
      })

      socket.on('requestPauseState', guildId => {
        this.sendPauseState(guildId)
      })

      socket.on('nextSong', (guildId, username) => {
        this.setNextSong(guildId, username)
      })

      socket.on('requestRepeatState', guildId => {
        this.sendRepeatState(guildId)
      })

      socket.on('changeRepeatState', guildId => {
        this.setRepeatState(guildId)
      })

      socket.on('shuffleQueue', (guildId, username) => {
        this.setShuffle(guildId, username)
      })

      socket.on('jumpToSong', (guildId, position) => {
        this.jumpToSong(guildId, position)
      })

      socket.on('deleteSong', (guildId, position) => {
        this.deleteSong(guildId, position)
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

  sendPauseState (guildId) {
    const guildDiscord = client.guilds.cache.get(guildId)
    if (!guildDiscord) return

    const queue = AudioPlayer.getQueue(guildDiscord)
    if (!queue) return
    this.io.to(guildId).emit('responsePauseState', queue.paused)
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

  async jumpToSong (guildId, position) {
    const guildDiscord = client.guilds.cache.get(guildId)
    if (!guildDiscord) return
    await AudioPlayer.distube.jump(guildDiscord, position)
  }

  async deleteSong (guildId, position) {
    const guildDiscord = client.guilds.cache.get(guildId)
    if (!guildDiscord) return
    const queue = AudioPlayer.getQueue(guildDiscord)
    if (!queue) return
    const message = await AudioPlayer.getPlayerMessageInGuild(guildDiscord)
    if (!message) return
    await AudioPlayer.deleteSongFromQueue(queue, position, message)

    this.sendPlaylistState(guildId)
  }
}

module.exports = { AudioPlayerSocketHandler }
