const config = require('config')
const { loggerSend } = require('../../custom_modules/tools')
const { wrap, sessionMiddleware } = require('../express/routes/auth')
const { AudioPlayerSocketHandler } = require('./AudioPlayerSocketHandler')

module.exports.WebsocketRun = () => {
  const PORT = config.get('SOCKET_IO_PORT')
  const io = require('socket.io')(PORT, {
    cors: {
      origin: [config.get('USER_APPLICATION_ADDRESS')],
      credentials: true
    }
  })

  loggerSend('Websocket сервер запущен на порту ' + PORT)
  const audioHandler = new AudioPlayerSocketHandler(io)

  io.use(wrap(sessionMiddleware))

  io.on('connection', socket => {
    if (!socket.request.session) {
      return
    }

    audioHandler.setEvents(socket)
  })
}
