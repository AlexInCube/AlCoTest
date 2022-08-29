const { PermissionsBitField, SlashCommandBuilder } = require('discord.js')

module.exports.help = {
  name: 'roll',
  group: 'fun',
  arguments: 'минимальное число, максимальное число',
  description: 'Выбирается случайное число из указанного диапазона, по умолчанию число 100',
  bot_permissions: [PermissionsBitField.Flags.SendMessages]
}

module.exports.slashBuilder = new SlashCommandBuilder()
  .setName(module.exports.help.name)
  .setDescription('Выбирается случайное число из указанного диапазона, по умолчанию число 100.')
  .addNumberOption(option =>
    option
      .setName('min')
      .setNameLocalizations({
        ru: 'мин'
      })
      .setDescription('Минимальное число')
      .setRequired(false)
  )
  .addNumberOption(option =>
    option
      .setName('max')
      .setDescription('Максимальное число')
      .setNameLocalizations({
        ru: 'макс'
      })
      .setRequired(false)
  )

module.exports.run = async ({ interaction }) => {
  let rollContent
  let min = interaction.options.get('min')?.value || 0
  const max = interaction.options.get('max')?.value || 100

  if (min === undefined) { // Если не задано минимальное, то числа будут от 0 до max
    rollContent = Math.ceil(Math.random() * max)
  } else {
    if (min > max) { min = max }
    rollContent = Math.ceil(Math.random() * (max - min)) + min
  }

  interaction.reply({ content: `Из диапазона ${min} - ${max} выпало ${rollContent}` })
}
