const { AuthRoutes } = require('./auth')
const leaderboardRoutes = require('./leaderboard')
const commandsRoutes = require('./commands')
const { VotingRoutes } = require('./voting')

module.exports = function (app) {
  AuthRoutes(app)
  leaderboardRoutes(app)
  commandsRoutes(app)
  VotingRoutes(app)
}
