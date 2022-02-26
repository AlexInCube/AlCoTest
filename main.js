const Discord = require('discord.js')
const config = require('config')

const { getCurrentTimestamp } = require('./custom_modules/tools')
const { mySQLSetup } = require('./custom_modules/mySQLSetup')
const { CommandsSetup } = require('./custom_modules/CommandHandler')
const { PlayerInitSetup } = require('./custom_modules/Audioplayer/AudioplayerSetup')

// Обработка не исключаемых исключений. Это на самом деле пиздец и так делать нельзя.
// НО, к примеру, мы не хотим крашить бота когда у нас рулетка работает нормально, а ошибка произошла в аудио модуле.
process.on('uncaughtException', function (err) {
  console.error(getCurrentTimestamp() + 'Uncaught Exception' + err.stack)
})

mySQLSetup()

const client = new Discord.Client({
  intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_VOICE_STATES', 'GUILD_MESSAGE_REACTIONS'],
  restTimeOffset: 0,
  shards: 'auto'
})

const distube = PlayerInitSetup(client)

module.exports = { client, distube }

CommandsSetup(client)

// Когда бот запустился
client.on('ready', () => {
  console.log(getCurrentTimestamp() + `Бот ${client.user.username} запустился`)
  client.user.setActivity('Напиши //help')
})

// ЛОГИН БОТА ДЕЛАТЬ ВСЕГДА В КОНЦЕ main.js
client.login(config.BOT_TOKEN)

// const ExpressServer = require('./web_application/ExpressServer.js')
