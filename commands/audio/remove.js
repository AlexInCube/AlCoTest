const { checkMemberInVoiceWithBotAndReply } = require('../../utilities/checkMemberInVoiceWithBot')
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js')
const { AudioPlayer } = require('../../main')
const { AudioPlayerEvents } = require('../../custom_modules/Audioplayer/AudioPlayerEvents')

module.exports.help = {
  name: 'remove',
  group: 'audio',
  arguments: '(позиция в очереди)',
  description: 'Удаляет песню из очереди по номеру.',
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
  interaction.reply({ content: 'Обработка запроса' })

  let pos = interaction.options.getNumber('position')
  if (Math.sign(pos) === 1) {
    pos -= 1
  }
  await AudioPlayer.playerEmitter.emit(AudioPlayerEvents.requestDeleteSong, interaction.guild, pos, interaction.member.user.username)

  interaction.deleteReply()
}
