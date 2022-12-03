const fs = require('fs')
const path = require('path')
const { Routes, Collection } = require('discord.js')
const { REST } = require('@discordjs/rest')
const { loggerSend } = require('../utilities/logger')
const { CheckBotPermissions } = require('../utilities/checkBotPermissions')

module.exports.CommandsSetup = async (client) => {
  // loggerSend('Начинаем загружать (/) команды.')

  client.commands = {
    executable: new Collection(), // Сюда сохраняются помощь о команде и функция исполняющую команду
    groups: new Map() // Здесь у нас группы в которых написано к чему относится команда
  }

  const commandsPath = 'commands'// Относительный путь к папке с командами

  const scanResult = getAllFiles(commandsPath)
  const buildersArray = []

  scanResult.forEach((filePath) => { // добавляем каждый файл в коллекцию команд
    const command = require(filePath)
    const groupName = command.help.group
    // Добавляем команду в исполняемые
    client.commands.executable.set(command.help.name, command)

    // Группируем команды для команды help
    if (!client.commands.groups.has(groupName)) {
      client.commands.groups.set(groupName, [command.help.name])
    } else {
      const commandsArray = client.commands.groups.get(groupName)
      commandsArray.push(command.help.name)
      client.commands.groups.set(groupName, commandsArray)
    }

    if (command.slashBuilder === undefined) { loggerSend(`Для команды ${command.help.name} не найден slashBuilder`); return }
    buildersArray.push(command.slashBuilder)
  })

  // Отправляем массив slashBuilder`ов в Discord
  // buildersArray.map(command => command.toJSON())
  const rest = new REST({ version: '10' }).setToken(process.env.BOT_DISCORD_TOKEN)

  await rest.put(
    Routes.applicationCommands(process.env.BOT_DISCORD_CLIENT_ID),
    { body: buildersArray }
  ).then(() => {
    loggerSend(`Загружено ${scanResult.length} команд`)
  }).catch((error) => {
    console.error(error)
  })

  // Объявляем обработчик "взамодействий"
  client.on('interactionCreate', async (interaction) => {
    // Если это команда из чата, выполняем её.
    if (interaction.isChatInputCommand()) {
      const { commandName } = interaction
      const commandFile = client.commands.executable.get(commandName) // получение команды из коллекции

      if (commandFile) {
        if (commandFile.help.guild_only) {
          if (!interaction.guild) {
            interaction.reply({ content: 'Эта команда может выполняться только на серверах', ephemeral: true })
            return
          }
        }

        if (!CheckBotPermissions(client, interaction, commandFile.help.bot_permissions)) { return }
        commandFile.run({
          interaction,
          client,
          guild: interaction.member.guild,
          channel: client.channels.cache.get(interaction.channelId)
        })
      }
    } else if (interaction.isAutocomplete()) {
      const { commandName } = interaction
      const commandFile = client.commands.executable.get(commandName) // получение команды из коллекции
      if (!commandFile.autocomplete) return

      try {
        if (commandFile) {
          commandFile.autocomplete({
            interaction,
            client
          })
        }
      } catch (e) {
        loggerSend(e)
      }
    }
  })
}

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
