const express = require('express')
const config = require('config')

const app = express()

require('./routes')(app)

const PORT = config.get('PORT')
app.listen(PORT, () => (console.log(`Веб-сервер запущен на порту ${PORT}`)))
