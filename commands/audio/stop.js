const { PermissionsBitField, SlashCommandBuilder } = require('discord.js')
const { AudioPlayer } = require('../../main')
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

module.exports.run = async ({ client, interaction }) => {
  if (!await AudioPlayer.checkMemberInVoiceWithBotAndReply(interaction.member, interaction)) return
  await AudioPlayer.stop(client.guilds.cache.get(interaction.guildId))
  await interaction.reply({ content: `${interaction.user.username} выключил плеер` })
}
