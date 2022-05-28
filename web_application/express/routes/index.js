const { AuthRoutes } = require('./auth')
const leaderboardRoutes = require('./leaderboard')
const commandsRoutes = require('./commands')

module.exports = function (app) {
  AuthRoutes(app)
  leaderboardRoutes(app)
  commandsRoutes(app)
}
