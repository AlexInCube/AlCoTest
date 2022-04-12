const { distube } = require('../../main')
const { Permissions } = require('discord.js')
const { CheckUserInVoice } = require('../../custom_modules/Audioplayer/Audioplayer')
module.exports.help = {
  name: 'move',
  group: 'audio',
  arguments: '(позиция в очереди)',
  description: 'Пропускает все песни до указанной позиции. Чтобы узнать позицию песни, нажмите "Показать очередь" в проигрывателе',
  bot_permissions: [Permissions.FLAGS.SEND_MESSAGES]
}

module.exports.run = async (client, message, args) => {
  if (await CheckUserInVoice(client, message)) return

  if (!distube.getQueue(message.guild)) { await message.reply('Никакой очереди не существует'); return }
  const moveNumber = parseInt(args[0])
  if (isNaN(moveNumber)) { await message.reply('Это не число'); return }
  try {
    await distube.jump(message.guild, moveNumber)
    await message.reply('Очередь перемещена')
  } catch (e) {
    await message.reply('Неверный номер песни')
  }
}
