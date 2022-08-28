const { checkMemberInVoiceWithBotAndReply } = require('../../utilities/checkMemberInVoiceWithBot')
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js')
const { AudioPlayer } = require('../../main')

module.exports.help = {
  name: 'remove',
  group: 'audio',
  arguments: '(позиция в очереди)',
  description: 'Удалить песню по номеру.',
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

  const pos = interaction.options.getNumber('position') - 1
  await AudioPlayer.playerEmitter.emit('requestDeleteSong', interaction.guild, pos, interaction.member.user.username)

  interaction.deleteReply()
}
