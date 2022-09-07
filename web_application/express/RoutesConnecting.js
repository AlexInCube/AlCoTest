const { AuthRoutes } = require('./routes/auth')
const leaderboardRoutes = require('./routes/leaderboard')
const commandsRoutes = require('./routes/commands')
const { VotingRoutes } = require('./routes/voting')
const statsRoutes = require('./routes/stats')
const patchNotesRoutes = require('./routes/patchnotes')
const privilegesRoutes = require('./routes/privileges')

module.exports = function (app) {
  AuthRoutes(app)
  leaderboardRoutes(app)
  commandsRoutes(app)
  VotingRoutes(app)
  statsRoutes(app)
  patchNotesRoutes(app)
  privilegesRoutes(app)
}
