const Discord = require('discord.js')
const fs = require('fs')
const { CheckAllNecessaryPermission, loggerSend } = require('./tools')
const path = require('path')
const config = require('config')
const prefix = config.get('BOT_PREFIX')
module.exports.prefix = prefix

module.exports.CommandsSetup = (client) => {
  client.commands = new Discord.Collection() // создаём коллекцию для команд
  client.commands_groups = new Map() // группируем команды в группы тупо для //help
  client.prefix = prefix

  function getAllFiles (dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath)

    arrayOfFiles = arrayOfFiles || []

    files.forEach(function (file) {
      const foundedFile = fs.statSync(dirPath + '/' + file)
      if (foundedFile.isDirectory()) {
        arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles)
      } else {
        const pathToPush = path.join('..//', dirPath, '/', file)
        if (pathToPush.endsWith('.js')) {
          arrayOfFiles.push(pathToPush)
        }
      }
    })

    return arrayOfFiles
  }

  const commandsPath = 'commands'

  const scanResult = getAllFiles(commandsPath)

  scanResult.forEach((filePath) => { // добавляем каждый файл в коллекцию команд
    const props = require(filePath)
    if (!client.commands_groups.has(props.help.group)) {
      client.commands_groups.set(props.help.group, [props.help.name])
    } else {
      const commandsArray = client.commands_groups.get(props.help.group)
      commandsArray.push(props.help.name)
      client.commands_groups.set(props.help.group, commandsArray)
    }
    client.commands.set(props.help.name, props)
  })

  loggerSend(`Загружено ${scanResult.length} команд`)
  // Находим имена команд (имя файла.js) и собираем их в коллекцию.

  client.on('messageCreate', function (message) {
    if (message.author.bot) return// Если автор сообщения бот, тогда не обрабатываем его.
    if (!message.content.startsWith(prefix)) return// Проверка префикса сообщения

    const commandBody = message.content.slice(prefix.length)
    let args = commandBody.split(' ')
    const command = args.shift().toLowerCase()

    if (!args) { args = [] }

    const commandFile = client.commands.get(command) // получение команды из коллекции
    try {
      if (commandFile) {
        if (!CheckAllNecessaryPermission(client, message, commandFile.help.bot_permissions)) { return }
        commandFile.run(client, message, args)
      } else {
        message.reply('Команды не существует')
      }
    } catch (e) {
      console.log(`${e.stack}`.slice(0, 2000))
    }
  })
}
