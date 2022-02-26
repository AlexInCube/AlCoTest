const { Permissions } = require('discord.js')
const { prefix } = require('../../custom_modules/CommandHandler')
const Discord = module.require('discord.js')

module.exports.help = {
  name: 'help',
  group: 'other',
  description: 'Всё таки кто-то догадался посмотреть помощь о помощи, раз ты такой умный, то возьми с полки пирожок.',
  bot_permissions: [Permissions.FLAGS.SEND_MESSAGES]
}

module.exports.run = async (client, message, args) => {
  if (args[0] === undefined) {
    const helpEmbed = new Discord.MessageEmbed()// Создаём сообщение с плеером
      .setColor('#436df7')
      .setTitle(`Введите ${prefix}help (название команды), чтобы узнать подробности`)
      .setDescription('Обозначения в аргументах команд:\n() - обязательно\n[] - по желанию')

    client.commands_groups.forEach((values, keys) => {
      let commandsList = ''
      values.forEach((value) => {
        commandsList += `\`${value}\` `
      })
      helpEmbed.addField(convertGroupToLocaleString(keys), commandsList, false)
    })

    await message.channel.send({ embeds: [helpEmbed] })
  } else {
    const commandData = client.commands.get(args[0])?.help
    if (!commandData) { await message.reply({ content: 'Такой команды не существует', ephemeral: true }); return }

    let permissionsString = ''
    const bot = message.guild.members.cache.get(client.user.id)// client.users.fetch(client.user.id)

    commandData.bot_permissions.forEach(function (value) {
      if (bot.permissions.has(value)) {
        permissionsString += '✅'
      } else {
        permissionsString += '❌'
      }
      permissionsString += '  ' + convertPermissionsToLocaleString(value) + '\n'
    })

    const helpEmbed = new Discord.MessageEmbed()// Создаём сообщение с плеером
      .setColor('#436df7')
      .setTitle(prefix + commandData.name + ' ' + `${commandData.arguments || ''}`)
      .setDescription(commandData.description || 'Описание не найдено')
      .addFields(
        { name: 'Права требуемые для БОТА, не для пользователя: ', value: permissionsString || 'Права не требуются' }
      )

    await message.channel.send({ embeds: [helpEmbed] })
  }

  function convertPermissionsToLocaleString (permission) {
    switch (permission) {
      case Permissions.FLAGS.SEND_MESSAGES: return 'Отправлять сообщения'
      case Permissions.FLAGS.MANAGE_MESSAGES: return 'Управлять сообщениями'
      case Permissions.FLAGS.CONNECT: return 'Подключаться'
      case Permissions.FLAGS.SPEAK: return 'Говорить'
      case Permissions.FLAGS.VIEW_CHANNEL: return 'Просматривать каналы'
      case Permissions.FLAGS.ATTACH_FILES: return 'Прикреплять файлы'
      default: return 'Не найдено название прав: ' + permission
    }
  }

  function convertGroupToLocaleString (group) {
    switch (group) {
      case 'audio': return 'Аудио'
      case 'fun': return 'Развлечения'
      case 'other': return 'Остальное'
    }
  }
}
