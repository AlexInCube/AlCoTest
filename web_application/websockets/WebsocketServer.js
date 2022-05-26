const config = require('config')
const { loggerSend } = require('../../custom_modules/tools')
const { distube, client } = require('../../main')
const { pausePlayer } = require('../../custom_modules/Audioplayer/Audioplayer')

const PORT = parseInt(config.get('PORT')) + 1
const io = require('socket.io')(PORT, {
  cors: {
    origin: [config.get('USER_APPLICATION_ADDRESS')]
  }
})
loggerSend('Websocket сервер запущен на порту ' + PORT)

io.on('connection', socket => {
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
  sendCurrentDuration(musicQueue.textChannel.guild.id)
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
  const guildDiscord = client.guilds.cache.get(guildId)
  const playlist = []
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

  io.emit('responsePlaylist', playlist)
}

function sendCurrentDuration (guildId) {
  const guildDiscord = client.guilds.cache.get(guildId)
  if (guildDiscord) {
    const queue = distube.getQueue(guildDiscord)
    if (queue) {
      io.emit('responseCurrentDuration', Math.round(queue.currentTime))
    }
  }
}

function sendPauseState (guildId) {
  const guildDiscord = client.guilds.cache.get(guildId)
  if (guildDiscord) {
    const queue = distube.getQueue(guildDiscord)
    if (queue) {
      io.emit('responsePauseState', queue.paused)
    }
  }
}

async function setPauseState (guildId) {
  const guildDiscord = client.guilds.cache.get(guildId)
  if (guildDiscord) {
    const queue = distube.getQueue(guildDiscord)
    if (queue) {
      const channel = await client.channels.cache.get(musicPlayerMap[guildId].ChannelID)
      if (channel) {
        const message = await channel.messages.fetch(musicPlayerMap[guildId].MessageID)
        await pausePlayer(distube, message)
        io.emit('responsePauseState', queue.paused)
      }
    }
  }
}
