const express = require('express')
const config = require('config')
const { loggerSend } = require('../../custom_modules/tools')

module.exports.ExpressRun = () => {
  const app = express()
  app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', config.get('USER_APPLICATION_ADDRESS'))
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
    res.setHeader('Access-Control-Allow-Credentials', true)
    next()
  })

  require('./routes')(app)

  const PORT = config.get('EXPRESS_PORT')
  app.listen(PORT, () => loggerSend(`Express сервер запущен на порту ${PORT}`))
}
