const { wrap, sessionMiddleware } = require('../express/routes/auth')
const { AudioPlayerSocketHandler } = require('./AudioPlayerSocketHandler')
const { loggerSend } = require('../../utilities/logger')

module.exports.WebsocketRun = () => {
  const PORT = process.env.BOT_SOCKET_IO_PORT
  const io = require('socket.io')(PORT, {
    cors: {
      origin: [process.env.BOT_DASHBOARD_URL],
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
