const { PermissionsBitField, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')

module.exports.help = {
  name: 'timer',
  group: 'other',
  arguments: '(длительность)',
  short_description: 'Запускает таймер, по умолчанию время 10 секунд',
  description: 'Запускает таймер на указанное время, по умолчанию время 10 секунд, максимальное 300 секунд.',
  bot_permissions: [PermissionsBitField.Flags.SendMessages]
}

module.exports.slashBuilder = new SlashCommandBuilder()
  .setName(module.exports.help.name)
  .setDescription(module.exports.help.description)
  .addNumberOption(option =>
    option.setName('time')
      .setNameLocalizations({
        ru: 'секунды'
      })
      .setDescription('Время в секундах')
      .setRequired(false)
  )

module.exports.run = async ({ client, interaction }) => {
  let duration = interaction.options.get('time').value || 10
  const maxDuration = 300
  const minDuration = 1

  if (duration > maxDuration) {
    interaction.reply({ content: 'Мне придётся слишком долго следить за временем, укажи время меньше 300 секунд (5 минут).' })
    return
  }
  if (duration < minDuration) {
    interaction.reply({ content: 'Будь на позитиве, числа в минус не подходят.' })
    return
  }

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder().setCustomId('stop_timer').setLabel('Выключить таймер').setStyle(ButtonStyle.Primary)
    )

  interaction.reply({ content: `Таймер запущен на ${duration} секунд` })
  const channel = client.channels.cache.get(interaction.channelId)
  const msg = await channel.send({ content: 'Время пошло', components: [row] })

  const interval = setInterval(async () => {
    await msg.edit({ content: `${duration--}` })
    if (duration === 0) {
      clearInterval(interval)
      await msg.edit({ content: `Время вышло! ${interaction.user}`, components: [] })
    }
  }, 1000)

  const filter = i => i.customId === 'stop_timer'

  const collector = msg.channel.createMessageComponentCollector({ filter })

  collector.on('collect', async i => {
    if (i.customId === 'stop_timer') {
      clearInterval(interval)
      await msg.edit({ content: `Таймер принудительно остановил ${i.user}`, components: [] })
    }
  })
}
