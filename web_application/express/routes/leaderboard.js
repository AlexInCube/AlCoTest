const express = require('express')
const { client } = require('../../../main')

module.exports = function (app) {
  // определяем Router
  const leaderboardRouter = express.Router()

  // определяем маршруты и их обработчики внутри роутера
  leaderboardRouter.use('/:game_stats/:column', async function (request, response) {
    const allowedTables = ['slot_stats', 'rps_stats']
    if (!allowedTables.some(element => element === request.params.game_stats)) {
      response.status(400)
      return
    }
    mySQLconnection.promise().query(`
    SELECT user_id as name, ${request.params.column} as value FROM ${request.params.game_stats}
    ORDER BY ${request.params.column} DESC LIMIT 10`
    )
      .then(async (results) => {
        const result = results[0]

        await (result.map(async (player, index) => {
          await client.users.fetch(player.name).then(async (user) => {
            await (result[index].name = user.username)
          })
          return 0
        }))

        response.send(result)
      })
      .catch(() => {
        response.status(400)
      })
  })
  app.use('/leaderboard', leaderboardRouter)
}