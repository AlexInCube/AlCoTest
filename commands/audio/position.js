const { Permissions } = require('discord.js')
const { distube } = require('../../main')
const { CheckUserInVoice } = require('../../custom_modules/Audioplayer/Audioplayer')
const config = require('config')
module.exports.help = {
  name: 'position',
  group: 'audio',
  arguments: '(время)',
  description: 'Меняет позицию с которой должна проигрываться песня. К примеру 3h 20m 15s',
  bot_permissions: [Permissions.FLAGS.SEND_MESSAGES]
}

module.exports.run = async (client, message, args) => {
  if (await CheckUserInVoice(client, message)) return

  const queue = distube.getQueue(message)

  if (!queue) { message.channel.send('Очереди не существует'); return }

  if (queue.songs[0].isLive) {
    message.reply({ content: 'Нельзя перематывать прямые трансляции' })
    return
  }

  if (!args) { message.reply({ content: `А время указать? Не понимаешь как? Пиши ${config.BOT_PREFIX}help position` }); return }

  let totalTime = 0
  args.forEach(arg => {
    totalTime += parseTime(arg)
  })

  if (!Number.isInteger(totalTime)) { message.reply({ content: 'Я не понял что ты написал' }); return }

  const previousTime = queue.formattedCurrentTime

  await distube.seek(queue, Number(totalTime))

  message.reply({ content: `Время изменено с ${previousTime} на ${queue.formattedCurrentTime}` })

  function parseTime (time) {
    const lastTimeChar = time.charAt(time.length - 1)
    try {
      time = parseInt(time.slice(0, -1))
      switch (lastTimeChar) {
        case 'h':
          return time * 60 * 60
        case 'm':
          return time * 60
        case 's':
          return time
        default:
          return 0
      }
    } catch (e) {
      return undefined
    }
  }
}
