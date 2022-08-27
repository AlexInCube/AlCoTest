require('fs')
const { AudioPlayer } = require('../../main')
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js')
const { isValidURL } = require('../../utilities/isValidUrl')
const { truncateString } = require('../../utilities/truncateString')

module.exports.help = {
  name: 'play',
  group: 'audio',
  arguments: '(запрос)',
  description: 'Проигрывает музыку указанную пользователем.' +
        'Принимаются:\n Ссылка с Youtube/Spotify/Soundcloud\n1 прикреплённый аудиофайл (mp3, wav или ogg)\nЛюбая писанина, будет запросом на поиск',
  bot_permissions: [
    PermissionsBitField.Flags.SendMessages,
    PermissionsBitField.Flags.Connect,
    PermissionsBitField.Flags.ViewChannel,
    PermissionsBitField.Flags.Speak,
    PermissionsBitField.Flags.ManageMessages,
    PermissionsBitField.Flags.AttachFiles
  ]
}

module.exports.slashBuilder = new SlashCommandBuilder()
  .setName(module.exports.help.name)
  .setDescription('Проигрывает музыку указанную пользователем.')
  .addStringOption(option =>
    option
      .setName('request')
      .setNameLocalizations({
        ru: 'запрос'
      })
      .setDescription('Ссылка с Youtube/Spotify/Soundcloud или любой текст')
      .setAutocomplete(true)
      .setRequired(false)
  )
  .addAttachmentOption(option =>
    option
      .setName('file')
      .setNameLocalizations({
        ru: 'файл'
      })
      .setDescription('Прикреплённый файл')
      .setRequired(false)
  )

module.exports.autocomplete = async ({ interaction }) => {
  const focusedValue = interaction.options.getFocused()
  let finalResult = []
  if (focusedValue && !isValidURL(focusedValue)) {
    const choices = await AudioPlayer.distube.search(focusedValue, { limit: 10, type: 'video', safeSearch: false })
    finalResult = choices.map(choice => ({
      name: `${choice.formattedDuration} | ${truncateString(choice.uploader.name, 20)} | ${truncateString(choice.name, 70)}`,
      value: choice.url
    }))
  }
  await interaction.respond(finalResult)
}

module.exports.run = async ({ interaction }) => {
  await AudioPlayer.actions.play(interaction)
}
