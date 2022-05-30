const Discord = require('discord.js')
const config = require('config')

const { getCurrentTimestamp, loggerSend } = require('./custom_modules/tools')
const { mySQLSetup } = require('./custom_modules/mySQLSetup')
const { CommandsSetup } = require('./custom_modules/CommandHandler')
const { Intents } = require('discord.js')
const { AudioPlayerModule } = require('./custom_modules/AudioPlayerModule')

// Обработка не исключаемых исключений. Это на самом деле пиздец и так делать нельзя.
// НО, к примеру, мы не хотим крашить бота когда у нас рулетка работает нормально, а ошибка произошла в аудио модуле.
process.on('uncaughtException', function (err) {
  console.error(getCurrentTimestamp() + 'Uncaught Exception' + err.stack)
})

mySQLSetup()

const client = new Discord.Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
  restTimeOffset: 0,
  shards: 'auto'
})

const AudioPlayer = new AudioPlayerModule(client, {
  prefix: config.get('BOT_PREFIX'),
  ytcookie: config.get('YOUTUBE_COOKIE'),
  spotify: {
    clientId: config.get('SPOTIFY_CLIENT_ID'),
    clientSecret: config.get('SPOTIFY_CLIENT_SECRET')
  }
})

module.exports = { AudioPlayer, client }

CommandsSetup(client, config.get('BOT_PREFIX'))

const { ExpressRun } = require('./web_application/express/ExpressServer.js')
const { WebsocketRun } = require('./web_application/websockets/WebsocketServer')

// Когда бот запустился
client.on('ready', () => {
  loggerSend(`Бот ${client.user.username} запустился`)
  client.user.setActivity(`Напиши ${config.BOT_PREFIX}help`)

  ExpressRun()
  WebsocketRun()
})

// ЛОГИН БОТА ДЕЛАТЬ ВСЕГДА В КОНЦЕ main.js
client.login(config.BOT_TOKEN)
