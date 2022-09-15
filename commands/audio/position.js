const { PermissionsBitField, SlashCommandBuilder } = require('discord.js')
const { AudioPlayer } = require('../../main')
const { checkMemberInVoiceWithBotAndReply } = require('../../utilities/checkMemberInVoiceWithBot')
const { AudioPlayerEvents } = require('../../custom_modules/Audioplayer/AudioPlayerEvents')
module.exports.help = {
  name: 'position',
  group: 'audio',
  arguments: '(время в секундах)',
  description: 'Меняет время с которого должна проигрываться песня.',
  bot_permissions: [PermissionsBitField.Flags.SendMessages]
}

module.exports.slashBuilder = new SlashCommandBuilder()
  .setName(module.exports.help.name)
  .setDescription(module.exports.help.description)
  .addNumberOption(option =>
    option
      .setName('time')
      .setDescription('Перемотка на указанное время')
      .setNameLocalizations({
        ru: 'секунды'
      })
      .setRequired(true)
  )

module.exports.run = async ({ interaction, guild }) => {
  if (!await AudioPlayer.playerIsExists(interaction)) return
  if (!await checkMemberInVoiceWithBotAndReply(interaction.member, interaction)) return
  if (!await AudioPlayer.discordGui.isChannelWithPlayer(interaction)) {
    return
  }

  if (AudioPlayer.getQueue(guild).songs[0].isLive) {
    interaction.reply({ content: 'Нельзя перематывать прямые трансляции' })
  }

  interaction.reply({ content: 'Обработка запроса' })

  const time = interaction.options.getNumber('time')
  await AudioPlayer.playerEmitter.emit(AudioPlayerEvents.requestChangeSongTime, interaction.guild, time, interaction.member.user.username)

  interaction.deleteReply()
}
