const { PermissionsBitField, SlashCommandBuilder } = require('discord.js')
const { AudioPlayer } = require('../../main')
const { checkMemberInVoiceWithBotAndReply } = require('../../utilities/checkMemberInVoiceWithBot')
module.exports.help = {
  name: 'playing',
  group: 'audio',
  arguments: '',
  description: 'Показывает текущее время проигрывания песни',
  bot_permissions: [PermissionsBitField.Flags.SendMessages]
}

module.exports.slashBuilder = new SlashCommandBuilder()
  .setName(module.exports.help.name)
  .setDescription(module.exports.help.description)

module.exports.run = async ({ interaction }) => {
  if (!await AudioPlayer.playerIsExists(interaction)) return
  if (!await checkMemberInVoiceWithBotAndReply(interaction.member, interaction)) return
  if (!await AudioPlayer.discordGui.isChannelWithPlayer(interaction)) {
    return
  }
  await AudioPlayer.getCurrentPlayingMessage(interaction)
}
