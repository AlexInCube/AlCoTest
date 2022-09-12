const { PermissionsBitField, SlashCommandBuilder } = require('discord.js')
const { AudioPlayer } = require('../../main')
const { AudioPlayerEvents } = require('../../custom_modules/Audioplayer/AudioPlayerEvents')
module.exports.help = {
  name: 'stop',
  group: 'audio',
  arguments: '',
  description: 'Выключает плеер',
  bot_permissions: [PermissionsBitField.Flags.SendMessages]
}

module.exports.slashBuilder = new SlashCommandBuilder()
  .setName(module.exports.help.name)
  .setDescription(module.exports.help.description)

module.exports.run = async ({ interaction, guild }) => {
  if (!await AudioPlayer.playerIsExists(interaction)) return

  await AudioPlayer.playerEmitter.emit(AudioPlayerEvents.requestStopPlayer, guild)
  await interaction.reply({ content: `${interaction.user.username} выключил плеер` })
}
