require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })

const { Client, GatewayIntentBits } = require('discord.js')
const { mySQLSetup } = require('./custom_modules/mySQLSetup')
const { CommandsSetup } = require('./custom_modules/CommandHandler')
const { AudioPlayerModule } = require('./custom_modules/Audioplayer/AudioPlayerModule')
const { getCurrentTimestamp, loggerSend } = require('./utilities/logger')

// Обработка не исключаемых исключений. Это на самом деле пиздец и так делать нельзя.
// НО, к примеру, мы не хотим крашить бота когда у нас рулетка работает нормально, а ошибка произошла в аудио модуле.
process.on('uncaughtException', function (err) {
  console.error(getCurrentTimestamp() + 'Uncaught Exception' + err.stack)
})

mySQLSetup()

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates],
  restTimeOffset: 0,
  shards: 'auto'
})

const AudioPlayer = new AudioPlayerModule(client, {
  ytcookie: process.env.BOT_YOUTUBE_COOKIE,
  spotify: {
    clientId: process.env.BOT_SPOTIFY_CLIENT_ID,
    clientSecret: process.env.BOT_SPOTIFY_CLIENT_SECRET
  }
})

module.exports = { AudioPlayer, client }

CommandsSetup(client)

if (parseInt(process.env.BOT_DASHBOARD_ENABLE) === 1) {
  const { ExpressRun } = require('./web_application/express/ExpressServer.js')
  const { WebsocketRun } = require('./web_application/websockets/WebsocketServer')

  ExpressRun()
  WebsocketRun()
} else {
  loggerSend('Веб-панель бота была отключена')
}

// Когда бот запустился
client.once('ready', () => {
  loggerSend(`Бот ${client.user.username} запустился, версия ${process.env.npm_package_version}`)
  client.user.setActivity('Напиши /help')
})

// ЛОГИН БОТА ДЕЛАТЬ ВСЕГДА В КОНЦЕ main.js
client.login(process.env.BOT_DISCORD_TOKEN)
