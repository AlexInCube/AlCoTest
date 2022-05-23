const ws = require('ws')
const config = require('config')
const { loggerSend } = require('../../custom_modules/tools')
const { distube, client } = require('../../main')
const PORT = parseInt(config.get('PORT')) + 1

const wss = new ws.Server({
  port: PORT
}, () => loggerSend('Websocket сервер запущен на порту ' + PORT))

wss.on('connection', function connection (sock) {
  sock.on('message', function (message) {
    message = JSON.parse(message)
    switch (message.event) {
      case 'connection':
        sock.guildId = message.id
        sendPlaylistState(message.id)
        break

      case 'getPlaylist':
        sock.guildId = message.id
        sendPlaylistState(message.id)
        break

      case 'getCurrentDuration':
        sock.guildId = message.id
        sendCurrentDuration(message.id)
        break
    }
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
})
distube.on('addList', async (musicQueue) => {
  sendPlaylistState(musicQueue.textChannel.guild.id)
})
distube.on('addSong', async (musicQueue) => {
  sendPlaylistState(musicQueue.textChannel.guild.id)
})

function sendPlaylistState (guildId) {
  const guildDiscord = client.guilds.cache.get(guildId)
  const songs = []
  if (guildDiscord) {
    const queue = distube.getQueue(guildDiscord)
    if (queue) {
      queue.songs.forEach((song) => {
        songs.push({ title: song.name, author: song.uploader.name, requester: song.user.username, duration: song.duration, img: song.thumbnail, url: song.url })
      })
    }
  }
  wss.clients.forEach(client => {
    if (client.guildId === guildId) {
      client.send(JSON.stringify({ data: songs, method: 'getPlaylist' }))
    }
  })
}

function sendCurrentDuration (guildId) {
  const guildDiscord = client.guilds.cache.get(guildId)
  if (guildDiscord) {
    const queue = distube.getQueue(guildDiscord)
    if (queue) {
      wss.clients.forEach(client => {
        if (client.guildId === guildId) {
          client.send(JSON.stringify({ data: queue.currentTime, method: 'getCurrentDuration' }))
        }
      })
    }
  }
}
