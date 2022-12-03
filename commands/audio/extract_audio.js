const { PermissionsBitField, SlashCommandBuilder } = require('discord.js')
const { AudioPlayer } = require('../../main')
const { searchSong } = require('../../custom_modules/Audioplayer/downloadSongHandling')

module.exports.help = {
  name: 'extract_audio',
  group: 'audio',
  arguments: '(Ссылка на Youtube видео или Spotify трек)',
  description: 'Скачивает звук из видео и отправляет его в чат. Если трек из Spotify, то он ищется на Youtube.',
  bot_permissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageMessages, PermissionsBitField.Flags.AttachFiles],
  guild_only: true
}

module.exports.slashBuilder = new SlashCommandBuilder()
  .setName(module.exports.help.name)
  .setDescription(module.exports.help.description)

module.exports.slashBuilder = new SlashCommandBuilder()
  .setName(module.exports.help.name)
  .setDescription('Скачивает звук из видео и отправляет его в чат. Если трек из Spotify, то он ищется на Youtube.')
  .addStringOption(option =>
    option
      .setName('request')
      .setNameLocalizations({
        ru: 'ссылка'
      })
      .setDescription('Ссылка с Youtube/Spotify/Soundcloud')
      .setRequired(true)
  )

module.exports.run = async ({ interaction }) => {
  const song = await searchSong(interaction.options.getString('request'))
  if (song === undefined) {
    await interaction.reply({ content: `${interaction.user.username} я не смог ничего найти` })
    return
  }
  await AudioPlayer.discordGui.extractAudioToMessage(interaction, song)
}
