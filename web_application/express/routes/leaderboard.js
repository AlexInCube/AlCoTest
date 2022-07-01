const express = require('express')
const { client } = require('../../../main')

module.exports = function (app) {
  // определяем Router
  const leaderboardRouter = express.Router()

  // определяем маршруты и их обработчики внутри роутера
  leaderboardRouter.use('/:game_stats/:column/:user_id?', async function (request, response) {
    const allowedTables = ['slot_stats', 'rps_stats']
    if (!allowedTables.some(element => element === request.params.game_stats)) {
      response.status(400)
      return
    }

    if (request.params.user_id) {
      mySQLconnection.promise().query(
        `SELECT ${request.params.column} as value FROM ${request.params.game_stats} WHERE user_id = ${request.params.user_id}`
      ).then(async (results) => {
        response.send({ value: results[0][0].value })
      }).catch(() => {
        response.status(400)
      })
    } else {
      mySQLconnection.promise().query(
        `SELECT user_id as userId, ${request.params.column} as value FROM ${request.params.game_stats}
            ORDER BY ${request.params.column} DESC LIMIT 10`
      ).then(async (results) => {
        const result = results[0]

        const userFetchingPromise = new Promise(function (resolve, reject) {
          result.map(async (player, index) => {
            client.users.fetch(player.userId)
              .then((user) => {
                result[index].name = user.username
              })
              .catch(() => {
                result[index].name = 'Имя не найдено'
              })
          })

          resolve(result)
        })

        userFetchingPromise.then((result1) => { response.send(result1) })
      }).catch(() => {
        response.status(400)
      })
    }
  })

  app.use('/leaderboard', leaderboardRouter)
}
