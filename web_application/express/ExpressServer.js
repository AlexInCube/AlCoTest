const express = require('express')
const { loggerSend } = require('../../utilities/logger')

module.exports.ExpressRun = () => {
  const app = express()
  app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', process.env.BOT_DASHBOARD_URL)
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
    res.setHeader('Access-Control-Allow-Credentials', true)
    next()
  })

  require('./RoutesConnecting')(app)

  const PORT = process.env.BOT_EXPRESS_PORT
  app.listen(PORT, () => loggerSend(`Express сервер запущен на порту ${PORT}`))
}
