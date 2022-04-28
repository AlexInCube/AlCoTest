const { Permissions, MessageEmbed } = require('discord.js')
const { distube } = require('../../main')
const { filledBar } = require('string-progressbar')
module.exports.help = {
  name: 'playing',
  group: 'audio',
  arguments: '',
  description: 'Показывает текущее время проигрывания песни',
  bot_permissions: [Permissions.FLAGS.SEND_MESSAGES]
}

module.exports.run = async (client, message) => {
  const queue = distube.getQueue(message.guild)

  if (!queue) { message.channel.send('Очереди не существует'); return }

  const progressBar = filledBar(queue.duration, queue.currentTime, 40, '-', '=')
  const durationString = queue.formattedCurrentTime + ` ${progressBar[0]} ` + queue.formattedDuration

  const playingEmbed = new MessageEmbed()
    .setTitle(queue.songs[0].name)
    .setURL(queue.songs[0].url)
    .setDescription(durationString)

  await message.channel.send({ embeds: [playingEmbed], ephemeral: true })

  await message.delete()
}
