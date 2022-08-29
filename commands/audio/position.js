const { PermissionsBitField, SlashCommandBuilder } = require('discord.js')
const { AudioPlayer } = require('../../main')
const { checkMemberInVoiceWithBotAndReply } = require('../../utilities/checkMemberInVoiceWithBot')
module.exports.help = {
  name: 'position',
  group: 'audio',
  arguments: '(время)',
  description: 'Меняет позицию с которой должна проигрываться песня. К примеру 3h 20m 15s',
  bot_permissions: [PermissionsBitField.Flags.SendMessages]
}

module.exports.slashBuilder = new SlashCommandBuilder()
  .setName(module.exports.help.name)
  .setDescription(module.exports.help.description)
  .addNumberOption(option =>
    option
      .setName('position')
      .setDescription('Номер песни из очереди')
      .setNameLocalizations({
        ru: 'номер'
      })
      .setRequired(true)
  )

module.exports.run = async ({ interaction }) => {
  if (!await AudioPlayer.playerIsExists(interaction)) return
  if (!await checkMemberInVoiceWithBotAndReply(interaction.member, interaction)) return
  await AudioPlayer.position(message, args)
}
