const { AudioPlayer } = require('../../main')
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js')
const { checkMemberInVoiceWithBotAndReply } = require('../../utilities/checkMemberInVoiceWithBot')
module.exports.help = {
  name: 'jump',
  group: 'audio',
  arguments: '(позиция в очереди)',
  description: 'Пропускает все песни до указанной.',
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
  let pos = interaction.options.getNumber('position')
  if (pos > 1) { pos-- } else if (pos < -1) { pos++ }
  await AudioPlayer.playerEmitter.emit('queueJump', interaction.guild, pos, interaction.member.user.username)
}
