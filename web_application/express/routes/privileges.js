const { isOverpowered } = require('../../../utilities/isOverpowered')
module.exports = function (app) {
  app.get('/isOverpowered', function (req, res) {
    res.send(isOverpowered(req.query.id)).status(200)
  })
}
