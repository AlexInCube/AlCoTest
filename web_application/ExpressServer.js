const express = require('express')
const config = require('config')

const app = express()

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
  res.setHeader('Access-Control-Allow-Credentials', true)
  next()
})

app.use(express.json())

require('./routes')(app)

const PORT = config.get('PORT')
app.listen(PORT, () => (console.log(`Веб-сервер запущен на порту ${PORT}`)))
