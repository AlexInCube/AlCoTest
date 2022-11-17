const { getVoiceConnection } = require('@discordjs/voice')

/**
 * Проверяет, есть ли в принципе БОТ в голосовом чате
 * @param guild
 * @returns {Promise<boolean>}
 */
async function checkBotInVoice (guild) {
  const connection = await getVoiceConnection(guild.id, guild.client.user?.id)
  return !!connection
}
/**
 * Проверяет, есть ли в принципе пользователь в голосовом чате
 * @param member
 * @param interaction
 * @returns {Promise<boolean>}
 */
async function checkMemberInVoiceWithReply (member, interaction) {
  if (!member.voice.channel) {
    await interaction.reply({
      content: 'Зайди в любой голосовой канал, чтобы пользоваться мной.',
      ephemeral: true
    })
    return false
  }
  return true
}
/**
 * Проверяет, находится ли пользователь в одном голосовом канале вместе с ботом.
 * @param member
 */
async function checkMemberInVoiceWithBot (member) {
  if (!member.voice.channel) { return false }

  const connection = await getVoiceConnection(member.guild.id, member.guild.client.user?.id)
  if (connection) {
    return connection.joinConfig.channelId === member.voice.channel.id
  } else {
    return false
  }
}

/**
 * Проверяет, находится ли пользователь в одном голосовом канале вместе с ботом.
 * Но, при этом можно ответить с сообщением об ошибке.
 * @param member
 * @param interaction
 */
async function checkMemberInVoiceWithBotAndReply (member, interaction) {
  const connection = await getVoiceConnection(interaction.guildId, interaction.client.user?.id) ?? await getVoiceConnection(interaction.guildId)
  if (connection) { // Проверяем, подключён ли бот хоть к какому-нибудь голосовому каналу
    if (member.voice.channel) {
      if (connection.joinConfig.channelId === member.voice?.channel.id) { // Если голосовой канал бота и пользователя совпадают
        return true
      }
    }

    await interaction.client.channels.fetch(connection.joinConfig.channelId).then(channel => {
      interaction.reply({ content: `Зайди на голосовой канал ${channel.name}, чтобы пользоваться мной.`, ephemeral: true })
      return false
    })
  }

  if (!member.voice.channel) {
    await interaction.reply({
      content: 'Зайди в любой голосовой канал, чтобы пользоваться мной.',
      ephemeral: true
    })
    return false
  }
}

module.exports = { checkBotInVoice, checkMemberInVoiceWithReply, checkMemberInVoiceWithBotAndReply, checkMemberInVoiceWithBot }
