const { PermissionsBitField } = require('discord.js')
function CheckBotPermissions (client, interaction, permissionsRequired) {
  const guild = client.guilds.cache.get(interaction.guildId)
  const bot = guild.members.cache.get(client.user.id)
  const permissionProvided = bot.permissions.has(permissionsRequired)
  if (!permissionProvided) {
    if (bot.permissions.has(PermissionsBitField.FLAGS.SendMessages)) {
      interaction.reply('У БОТА недостаточно прав, напишите /help (название команды), чтобы увидеть недостающие права. А также попросите администрацию сервера их выдать.')
    }
  }
  return permissionProvided
}

module.exports = { CheckBotPermissions }
