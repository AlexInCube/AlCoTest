const { PermissionsBitField, SlashCommandBuilder, EmbedBuilder } = require('discord.js')

module.exports.help = {
  name: 'help',
  group: 'other',
  description: 'Подробное описание команд',
  bot_permissions: []
}

module.exports.slashBuilder = new SlashCommandBuilder()
  .setName(module.exports.help.name)
  .setDescription(module.exports.help.description)
  .addStringOption(option =>
    option.setName('command')
      .setNameLocalizations({
        ru: 'команда'
      })
      .setDescription('Подробности об указанной команде')
      .setRequired(false)
      .setAutocomplete(true)
  )

module.exports.autocomplete = async ({ client, interaction }) => {
  // Превращаем результаты поиска в подсказки
  const finalResult = [...client.commands.executable].map(function (command) {
    return {
      name: command[0],
      value: command[0]
    }
  })

  await interaction.respond(finalResult)
}

module.exports.run = async ({ client, interaction, guild }) => {
  const commandName = interaction.options.getString('command')
  if (commandName) { // Если конкретная команда не указана, то выводим список
    await replySpecificCommand()
  } else { // Если указана конкретная команда
    await replyCommandsList()
  }

  async function replyCommandsList () {
    let description = 'Обозначения в аргументах команд:\n() - обязательно\n[] - по желанию'
    if (process.env.BOT_DASHBOARD_ENABLE === '1') {
      description += `\n
      Больше информации на ${process.env.BOT_DASHBOARD_URL}`
    }

    const helpEmbed = new EmbedBuilder()
      .setColor('#436df7')
      .setTitle('Справка о командах')
      .setDescription(description)

    client.commands.groups.forEach((values, keys) => {
      let commandsList = ''
      values.forEach((value) => {
        commandsList += `\`${value}\` `
      })
      helpEmbed.addFields({ name: convertGroupToLocaleString(keys), value: commandsList, inline: false })
    })

    await interaction.reply({ embeds: [helpEmbed], ephemeral: true })
  }

  async function replySpecificCommand () {
    const commandData = client.commands.executable.get(commandName)?.help
    if (!commandData) {
      await interaction.reply({ content: 'Такой команды не существует', ephemeral: true })
      return
    }

    let permissionsString = ''
    const bot = guild.members.cache.get(client.user.id)

    commandData.bot_permissions.forEach(function (value) {
      if (bot.permissions.has(value)) {
        permissionsString += '✅'
      } else {
        permissionsString += '❌'
      }
      permissionsString += '  ' + convertPermissionsToLocaleString(value) + '\n'
    })

    const helpEmbed = new EmbedBuilder()
      .setColor('#436df7')
      .setTitle(`/${commandData.name} ${commandData.arguments || ''}`)
      .setDescription(commandData.description || 'Описание не найдено')
      .addFields(
        { name: 'Права требуемые для БОТА, не для пользователя: ', value: permissionsString || 'Права не требуются' }
      )

    await interaction.reply({ embeds: [helpEmbed], ephemeral: true })
  }

  function convertPermissionsToLocaleString (permission) {
    switch (permission) {
      case PermissionsBitField.Flags.SendMessages: return 'Отправлять сообщения'
      case PermissionsBitField.Flags.ManageMessages: return 'Управлять сообщениями'
      case PermissionsBitField.Flags.Connect: return 'Подключаться'
      case PermissionsBitField.Flags.Speak: return 'Говорить'
      case PermissionsBitField.Flags.ViewChannel: return 'Просматривать каналы'
      case PermissionsBitField.Flags.AttachFiles: return 'Прикреплять файлы'
      default: return 'Не найдено название прав: ' + permission
    }
  }

  function convertGroupToLocaleString (group) {
    switch (group) {
      case 'audio': return 'Аудио'
      case 'fun': return 'Развлечения'
      case 'other': return 'Остальное'
      default: return 'НЕИЗВЕСТНО'
    }
  }
}
