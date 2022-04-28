const { Permissions, MessageEmbed } = require('discord.js')
const config = require('config')
module.exports.help = {
  name: 'stats',
  group: 'fun',
  arguments: '[Название игры (команда которая вызывает игру)]',
  description: `Показывает вашу статистику в какой-то из игр. К примеру ${config.BOT_PREFIX}stats slot`,
  bot_permissions: [Permissions.FLAGS.SEND_MESSAGES]
}

module.exports.run = async (client, message, args) => {
  const userId = message.author.id
  const statEmbed = new MessageEmbed()

  if (!args[0]) {
    statEmbed.setAuthor({ name: 'Статистика существует для: ' }).setTitle(`Напишите ${config.BOT_PREFIX}stats [название игры]`).setDescription('`rps` `slot`')
    await message.reply({ embeds: [statEmbed] })
    return
  }

  switch (args[0]) {
    case 'slot':
      mySQLconnection.promise().query(`SELECT total_games, total_wins, jackpots FROM slot_stats WHERE user_id = ${userId}`)
        .then(async (results) => {
          await setStatTitle('Однорукий Бандит')
          const games = results[0][0].total_games; const wins = results[0][0].total_wins
          statEmbed.addField('Всего игр:', `${games}`, true)
          statEmbed.addField('Победная:', 'Всего побед: ' + `${wins}` + `\nПроцент побед: ${Math.round(wins / games * 100)}%`, true)
          statEmbed.addField('Джекпотов:', `${results[0][0].jackpots}`, true)
          await message.channel.send({ embeds: [statEmbed] })
        })
        .catch(() => {
          message.reply('Ты ещё ни разу не играл в эту игру')
        })
      break
    case 'rps':
      mySQLconnection.promise().query(`SELECT total_games, wins, draws FROM rps_stats WHERE user_id = ${userId}`)
        .then(async (results) => {
          await setStatTitle('Камень, ножницы, бумага!')
          const games = results[0][0].total_games; const wins = results[0][0].wins
          statEmbed.addField('Всего игр:', `${games}`, true)
          statEmbed.addField('Победная:', 'Всего побед: ' + `${wins}` + `\nПроцент побед: ${Math.round(wins / games * 100)}%`, true)
          statEmbed.addField('Ничьих:', `${results[0][0].draws}`, true)
          await message.channel.send({ embeds: [statEmbed] })
        })
        .catch(async () => {
          await message.reply('Ты ещё ни разу не играл в эту игру')
        })
      break
    default:
      await message.reply('Такой статистики не существует')
  }

  async function setStatTitle (gameName) {
    await statEmbed.setTitle(`Статистика ${message.author.username} по игре "${gameName}"`)
  }
}
