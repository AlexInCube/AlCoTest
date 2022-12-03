const { PermissionsBitField, SlashCommandBuilder } = require('discord.js')
const { AudioPlayer } = require('../../main')
const { isOverpowered } = require('../../utilities/isOverpowered')

module.exports.help = {
  name: 'audiodebug',
  group: 'audio',
  description: 'Только для разработчика бота. Показывает память плеера.',
  bot_permissions: [PermissionsBitField.Flags.SendMessages]
}

module.exports.slashBuilder = new SlashCommandBuilder()
  .setName(module.exports.help.name)
  .setDescription(module.exports.help.description)

module.exports.run = async ({ interaction }) => {
  if (!isOverpowered(interaction.member.id)) {
    interaction.reply({ content: 'Эта команда только для разработчиков бота, забудьте про неё', ephemeral: true })
    return
  }
  await interaction.reply({ content: JSON.stringify(AudioPlayer.musicPlayerMap), ephemeral: true })
}
