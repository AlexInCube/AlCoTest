const { distube, client } = require('../../main')
const express = require('express')
module.exports = function (app) {
  const audioPlayerRouter = express.Router()

  audioPlayerRouter.get('/getCurrentPlaylist/:guild_id', async (req, res) => {
    if (req.session.user) {
      const guildSession = req.session.guilds.find(guild => guild.id === req.params.guild_id)
      if (guildSession) {
        const guildDiscord = client.guilds.cache.get(guildSession.id)
        if (guildDiscord) {
          const queue = distube.getQueue(guildDiscord)
          if (queue) {
            const songs = []
            queue.songs.forEach((song) => {
              songs.push({ title: song.name, author: song.uploader.name, requester: 'requester', duration: song.duration, img: song.thumbnail })
            })
            res.status(200).send(songs)
            return
          }
          res.status(404).send([])
          return
        }
      }
    }
    res.status(403).send([])
  })

  app.use('/audioplayer', audioPlayerRouter)
}
