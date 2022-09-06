const { AuthRoutes } = require('./auth')
const leaderboardRoutes = require('./leaderboard')
const commandsRoutes = require('./commands')
const { VotingRoutes } = require('./voting')
const statsRoutes = require('./stats')
const patchNotesRoutes = require('./patchnotes')

module.exports = function (app) {
  AuthRoutes(app)
  leaderboardRoutes(app)
  commandsRoutes(app)
  VotingRoutes(app)
  statsRoutes(app)
  patchNotesRoutes(app)
}
