require('fs')
const { AudioPlayer } = require('../../main')
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js')
const { isValidURL } = require('../../utilities/isValidUrl')
const { truncateString } = require('../../utilities/truncateString')

module.exports.help = {
  name: 'play',
  group: 'audio',
  arguments: '(запрос)',
  description: 'Проигрывает музыку указанную пользователем. ' +
        'Принимаются:\n Ссылка с Youtube/Spotify/Soundcloud\n1 прикреплённый аудиофайл (mp3, wav или ogg)\nЛюбая писанина, будет запросом на поиск',
  bot_permissions: [
    PermissionsBitField.Flags.SendMessages,
    PermissionsBitField.Flags.Connect,
    PermissionsBitField.Flags.ViewChannel,
    PermissionsBitField.Flags.Speak,
    PermissionsBitField.Flags.ManageMessages,
    PermissionsBitField.Flags.AttachFiles
  ],
  guild_only: true
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
      .setRequired(true)
  )

module.exports.autocomplete = async ({ interaction }) => {
  try {
    const focusedValue = interaction.options.getFocused()

    let finalResult = []
    if (focusedValue && !isValidURL(focusedValue)) { // Если есть хоть какое-т значение и результат поиска не ссылка
      try {
        const choices = await AudioPlayer.distube.search(focusedValue, { limit: 10, type: 'video', safeSearch: false })
        // Превращаем результаты поиска в подсказки
        finalResult = choices.map(function (choice) {
          // Длина подсказки максимум 100 символов, поэтому пытаемся эффективно использовать это пространство
          const duration = choice.isLive ? 'Стрим' : choice.formattedDuration
          let choiceString = `${duration} | ${truncateString(choice.uploader.name, 20)} | `
          // Название видео пытается занять максимум символов, в то время как имя канала/автора может быть длиной только в 20 символов
          choiceString += truncateString(choice.name, 100 - choiceString.length)
          return {
            name: choiceString,
            value: choice.url
          }
        })
      } catch (e) {

      }
    }
    await interaction.respond(finalResult)
  } catch (e) {

  }
}

module.exports.run = async ({ interaction }) => {
  if (!await AudioPlayer.discordGui.isChannelWithPlayer(interaction)) {
    return
  }
  await AudioPlayer.actions.play(interaction)
}
