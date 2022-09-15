function CheckBotPermissions (client, interaction, permissionsRequired) {
  const guild = client.guilds.cache.get(interaction.guildId)
  const bot = guild.members.cache.get(client.user.id)
  const channelPermissions = bot.permissionsIn(interaction.channel)

  const permissionProvided = channelPermissions.has(permissionsRequired)
  if (!permissionProvided) {
    interaction.reply({
      content: ':no_entry: У БОТА недостаточно прав на этом канале или сервере :no_entry:.\n' +
        'Напишите /help (название команды), чтобы увидеть недостающие права. \n' +
        'А также попросите администрацию сервера их выдать боту.',
      ephemeral: true
    })
  }
  return permissionProvided
}

module.exports = { CheckBotPermissions }
