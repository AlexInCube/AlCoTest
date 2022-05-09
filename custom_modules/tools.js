const { Permissions } = require('discord.js')
const config = require('config')

function getCurrentTimestamp () {
  let today = new Date()
  const dd = String(today.getDate()).padStart(2, '0')
  const mm = String(today.getMonth() + 1).padStart(2, '0') // January is 0!
  const yyyy = today.getFullYear()
  const hour = today.getHours()
  const minute = today.getMinutes()
  const seconds = today.getSeconds()

  today = dd + '/' + mm + '/' + yyyy + ' | ' + hour + ':' + minute + ':' + seconds
  return `[ ${today.toString()} ] `
}

function isValidURL (str) {
  const pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', 'i') // fragment locator
  return !!pattern.test(str)
}

function ClearUsedIDFromMention (mention) {
  if (!mention) return

  if (mention.startsWith('<@&') && mention.endsWith('>')) {
    mention = mention.slice(3, -1)

    if (mention.startsWith('!')) {
      mention = mention.slice(1)
    }

    return mention
  }
}

function generateRandomCharacters (length) {
  let result = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() *
            charactersLength))
  }
  return result
}

function clamp (num, min, max) {
  return Math.min(Math.max(num, min), max)
}

function CheckAllNecessaryPermission (client, message, permissionsRequired) {
  const bot = message.guild.members.cache.get(client.user.id)// client.users.fetch(client.user.id)
  const permissionProvided = bot.permissions.has(permissionsRequired)
  if (!permissionProvided) {
    if (bot.permissions.has(Permissions.FLAGS.SEND_MESSAGES)) {
      message.channel.send(`У БОТА недостаточно прав, напишите ${config.BOT_PREFIX}help (название команды), чтобы увидеть недостающие права. А также попросите администрацию сервера их выдать.`)
    }
  }
  return permissionProvided
}

module.exports = { getCurrentTimestamp, isValidURL, ClearUsedIDFromMention, generateRandomCharacters, clamp, CheckAllNecessaryPermission }