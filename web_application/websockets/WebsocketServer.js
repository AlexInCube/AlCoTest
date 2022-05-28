const config = require('config')
const { loggerSend } = require('../../custom_modules/tools')
const { distube, client } = require('../../main')
const { pausePlayer, skipSong, getPlayerMessageInGuild } = require('../../custom_modules/Audioplayer/Audioplayer')
const { getSessionMiddleware } = require('../express/routes/auth')

module.exports.WebsocketRun = () => {
  const PORT = parseInt(config.get('PORT')) + 1
  const io = require('socket.io')(PORT, {
    cors: {
      origin: [config.get('USER_APPLICATION_ADDRESS')],
      credentials: true
    }

  })
  loggerSend('Websocket сервер запущен на порту ' + PORT)

  const wrap = middleware => (socket, next) => middleware(socket.request, {}, next)
  io.use(wrap(getSessionMiddleware()))

  io.use((socket, next) => {
    const session = socket.request.session
    if (session && session.user) {
      next()
    } else {
      next(new Error('unauthorized'))
    }
  })

  io.on('connection', socket => {
    if (!socket.request.session) {
      socket.emit('exception', { errorMessage: 'Не авторизован' })
      return
    }

    socket.on('joinAudioPlayer', guildId => {
      socket.request.session.reload(function () {})
      socket.rooms.forEach((room) => {
        socket.leave(room)
      })
      const guilds = socket.request.session.guilds
      // console.log(socket.request.session)
      if (guilds) {
        if (guilds.some(guild => guild.id === guildId)) {
          socket.join(guildId)
        }
      }
    })

    socket.on('requestPlaylist', guildId => {
      sendPlaylistState(guildId)
      sendPauseState(guildId)
    })

    socket.on('requestCurrentDuration', guildId => {
      sendCurrentDuration(guildId)
    })

    socket.on('changePauseState', (guildId, pause) => {
      setPauseState(guildId, pause)
    })

    socket.on('requestPauseState', guildId => {
      sendPauseState(guildId)
    })

    socket.on('nextSong', (guildId, username) => {
      setNextSong(guildId, username)
    })
  })

  distube.setMaxListeners(2)
  distube.on('playSong', async (musicQueue) => {
    sendPlaylistState(musicQueue.textChannel.guild.id)
  })
  distube.on('finishSong', async (musicQueue) => {
    sendPlaylistState(musicQueue.textChannel.guild.id)
  })
  distube.on('disconnect', async (musicQueue) => {
    sendPlaylistState(musicQueue.textChannel.guild.id)
    io.to(musicQueue.textChannel.guild.id).emit('responseCurrentDuration', 0)
  })
  distube.on('addList', async (musicQueue) => {
    sendPlaylistState(musicQueue.textChannel.guild.id)
  })
  distube.on('addSong', async (musicQueue) => {
    sendPlaylistState(musicQueue.textChannel.guild.id)
  })
  distube.on('pause', async (musicQueue) => {
    sendPauseState(musicQueue.textChannel.guild.id)
  })

  function sendPlaylistState (guildId) {
    const playlist = []
    const guildDiscord = client.guilds.cache.get(guildId)
    if (guildDiscord) {
      const queue = distube.getQueue(guildDiscord)
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

    io.to(guildId).emit('responsePlaylist', playlist)
  }

  function sendCurrentDuration (guildId) {
    const guildDiscord = client.guilds.cache.get(guildId)
    if (!guildDiscord) return
    const queue = distube.getQueue(guildDiscord)
    if (!queue) return
    io.to(guildId).emit('responseCurrentDuration', Math.round(queue.currentTime))
  }

  function sendPauseState (guildId) {
    const guildDiscord = client.guilds.cache.get(guildId)
    if (!guildDiscord) return

    const queue = distube.getQueue(guildDiscord)
    if (!queue) return
    io.to(guildId).emit('responsePauseState', queue.paused)
  }

  async function setPauseState (guildId) {
    const guildDiscord = client.guilds.cache.get(guildId)
    if (!guildDiscord) return
    const message = await getPlayerMessageInGuild(client, guildDiscord)
    if (!message) return

    await pausePlayer(distube, message)
  }

  async function setNextSong (guildId, username) {
    const guildDiscord = client.guilds.cache.get(guildId)
    if (!guildDiscord) return
    const queue = distube.getQueue(guildDiscord)

    const message = await getPlayerMessageInGuild(client, guildDiscord)
    if (!message) return
    await skipSong(distube, queue, message, username)
  }
}
