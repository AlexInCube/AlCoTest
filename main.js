require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })

const Discord = require('discord.js')
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
  prefix: process.env.BOT_PREFIX,
  ytcookie: process.env.BOT_YOUTUBE_COOKIE,
  spotify: {
    clientId: process.env.BOT_SPOTIFY_CLIENT_ID,
    clientSecret: process.env.BOT_SPOTIFY_CLIENT_SECRET
  }
})

module.exports = { AudioPlayer, client }

CommandsSetup(client, process.env.BOT_PREFIX)

if (parseInt(process.env.BOT_DASHBOARD_ENABLE) === 1) {
  const { ExpressRun } = require('./web_application/express/ExpressServer.js')
  const { WebsocketRun } = require('./web_application/websockets/WebsocketServer')

  ExpressRun()
  WebsocketRun()
} else {
  loggerSend('Веб-панель бота была отключена')
}

// Когда бот запустился
client.on('ready', () => {
  loggerSend(`Бот ${client.user.username} запустился`)
  client.user.setActivity(`Напиши ${process.env.BOT_PREFIX}help`)
})

// ЛОГИН БОТА ДЕЛАТЬ ВСЕГДА В КОНЦЕ main.js
client.login(process.env.BOT_DISCORD_TOKEN)
