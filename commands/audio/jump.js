const { AudioPlayer } = require('../../main')
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js')
const { checkMemberInVoiceWithBotAndReply } = require('../../utilities/checkMemberInVoiceWithBot')
const { AudioPlayerEvents } = require('../../custom_modules/Audioplayer/AudioPlayerEvents')
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
  if (!await AudioPlayer.discordGui.isChannelWithPlayer(interaction)) {
    return
  }

  let pos = interaction.options.getNumber('position')
  if (Math.sign(pos) === 1) {
    pos -= 1
  }

  interaction.reply({ content: 'Обработка запроса' })

  await AudioPlayer.playerEmitter.emit(AudioPlayerEvents.requestQueueJump, interaction.member.guild, pos, interaction.member.user.username)

  await interaction.deleteReply()
}
