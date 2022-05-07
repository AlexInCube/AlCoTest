const mainRoutes = require('./auth')
const leaderboardRoutes = require('../routes/leaderboard')

module.exports = function (app) {
  mainRoutes(app)
  leaderboardRoutes(app)
}
