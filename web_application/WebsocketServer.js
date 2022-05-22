const ws = require('ws')
const config = require('config')
const { loggerSend } = require('../custom_modules/tools')
const { client, distube } = require('../main')
const PORT = parseInt(config.get('PORT')) + 1

const wss = new ws.Server({
  port: PORT
}, () => loggerSend('Websocket сервер запущен на порту ' + PORT))

wss.on('connection', function connection (ws) {
  ws.on('message', function (message) {
    message = JSON.parse(message)
    switch (message.event) {
      case 'connection':
        break

      case 'getAudioState':
        sendAudioState(message.id)
        break
    }
  })
})

distube.setMaxListeners(2)
distube.on('playSong', async (musicQueue) => {
  sendAudioState(musicQueue.textChannel.guild.id)
})
distube.on('finishSong', async (musicQueue) => {
  sendAudioState(musicQueue.textChannel.guild.id)
})

function sendAudioState (guildId) {
  const guildDiscord = client.guilds.cache.get(guildId)
  const songs = []
  if (guildDiscord) {
    const queue = distube.getQueue(guildDiscord)
    if (queue) {
      queue.songs.forEach((song) => {
        songs.push({ title: song.name, author: song.uploader.name, requester: song.user.username, duration: song.duration, img: song.thumbnail })
      })
    }
  }
  wss.clients.forEach(client => {
    client.send(JSON.stringify(songs))
  })
}
