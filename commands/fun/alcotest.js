const { PermissionsBitField, SlashCommandBuilder } = require('discord.js')
module.exports.help = {
  name: 'alcotest',
  group: 'fun',
  description: 'Пишет процент пива в твоей крови',
  bot_permissions: [PermissionsBitField.Flags.SendMessages]
}

module.exports.slashBuilder = new SlashCommandBuilder()
  .setName(module.exports.help.name)
  .setDescription(module.exports.help.description)

module.exports.run = async ({ interaction }) => {
  interaction.reply({ content: `🍻 Вы состоите из пива на ${Math.round(Math.random() * 100)}% 🍻 ` })
}
