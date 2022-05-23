const mainRoutes = require('./auth')
const leaderboardRoutes = require('./leaderboard')
const commandsRoutes = require('./commands')

module.exports = function (app) {
  mainRoutes(app)
  leaderboardRoutes(app)
  commandsRoutes(app)
}
