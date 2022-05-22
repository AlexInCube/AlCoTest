const mainRoutes = require('./auth')
const leaderboardRoutes = require('../routes/leaderboard')
const commandsRoutes = require('../routes/commands')
const audioPlayerRoutes = require('../routes/audio')

module.exports = function (app) {
  mainRoutes(app)
  leaderboardRoutes(app)
  commandsRoutes(app)
  audioPlayerRoutes(app)
}
