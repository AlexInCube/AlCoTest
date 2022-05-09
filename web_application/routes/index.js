const mainRoutes = require('./auth')
const leaderboardRoutes = require('../routes/leaderboard')
const commandsRoutes = require('../routes/commands')

module.exports = function (app) {
  mainRoutes(app)
  leaderboardRoutes(app)
  commandsRoutes(app)
}
