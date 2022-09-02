require('fs')
const { AudioPlayer } = require('../../main')
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js')

module.exports.help = {
  name: 'playfile',
  group: 'audio',
  arguments: '(прикреплённый файл)',
  description: 'Проигрывает музыку из прикреплённого файла',
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
  .setDescription(module.exports.help.description)
  .addAttachmentOption(option =>
    option
      .setName('file')
      .setNameLocalizations({
        ru: 'файл'
      })
      .setDescription('Прикреплённый файл')
      .setRequired(true)
  )

module.exports.run = async ({ interaction }) => {
  await AudioPlayer.actions.play(interaction)
}
