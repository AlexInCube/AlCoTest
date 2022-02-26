const { MessageActionRow, MessageButton, Permissions } = require('discord.js')

module.exports.help = {
  name: 'timer',
  group: 'other',
  arguments: '(длительность)',
  description: 'Запускает таймер на указанное время, по умолчанию время 10 секунд, максимум можно поставить на 300 секунд.',
  bot_permissions: [Permissions.FLAGS.SEND_MESSAGES]
}

module.exports.run = async (client, message, args) => {
  let duration = 10
  const maxDuration = 300
  const minDuration = 1

  if (args.length > 0) {
    duration = parseInt(args[0])
  }
  if (isNaN(duration)) {
    message.reply({ content: 'Мне числа нужны, а не твои кракозябры.' })
    return
  }
  if (duration > maxDuration) {
    message.reply({ content: 'Мне придётся слишком долго следить за временем, укажи время меньше 300 секунд (5 минут).' })
    return
  }
  if (duration < minDuration) {
    message.reply({ content: 'Будь на позитиве, числа в минус не подходят.' })
    return
  }

  const row = new MessageActionRow()
    .addComponents(
      new MessageButton().setCustomId('stop_timer').setLabel('Выключить таймер').setStyle('PRIMARY')
    )

  const msg = await message.reply({ content: 'Время пошло', components: [row] })

  const interval = setInterval(async () => {
    await msg.edit({ content: `${duration--}` })
    if (duration === 0) {
      clearInterval(interval)
      await msg.edit({ content: `Таймер остановлен! ${msg.author.user}`, components: [] })
    }
  }, 1000)

  const filter = i => i.customId === 'stop_timer'

  const collector = message.channel.createMessageComponentCollector({ filter })

  collector.on('collect', async i => {
    if (i.customId === 'stop_timer') {
      clearInterval(interval)
      await i.update({ content: `Таймер остановлен! ${msg.author.user}`, components: [] })
    }
  })
}
