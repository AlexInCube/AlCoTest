const { PermissionsBitField, SlashCommandBuilder } = require('discord.js')
const { AudioPlayer } = require('../../main')
const { checkMemberInVoiceWithBotAndReply } = require('../../utilities/checkMemberInVoiceWithBot')
const { AudioPlayerEvents } = require('../../custom_modules/Audioplayer/AudioPlayerEvents')
module.exports.help = {
  name: 'shuffle',
  group: 'audio',
  arguments: '',
  description: 'Перемешивает все песни в очереди',
  bot_permissions: [PermissionsBitField.Flags.SendMessages]
}

module.exports.slashBuilder = new SlashCommandBuilder()
  .setName(module.exports.help.name)
  .setDescription(module.exports.help.description)

module.exports.run = async ({ interaction }) => {
  if (!await AudioPlayer.playerIsExists(interaction)) return
  if (!await checkMemberInVoiceWithBotAndReply(interaction.member, interaction)) return

  interaction.reply({ content: 'Обработка запроса' })

  await AudioPlayer.playerEmitter.emit(AudioPlayerEvents.requestQueueShuffle, interaction.guild, interaction.user.username)

  interaction.deleteReply()
}
