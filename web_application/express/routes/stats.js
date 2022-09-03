const express = require('express')
const { client } = require('../../../main')

module.exports = function (app) {
  const statsRouter = express.Router()

  statsRouter.use('/guilds-count', async function (request, response) {
    const guilds = client.guilds.cache.size.toString()
    response.send(guilds)
  })

  statsRouter.use('/members-count', async function (request, response) {
    response.send(client.guilds.cache.reduce((a, g) => a + g.memberCount, 0).toString())
  })

  app.use('/stats', statsRouter)
}
