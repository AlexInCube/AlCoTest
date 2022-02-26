const { Permissions } = require('discord.js')
const { setupUserData } = require('../../custom_modules/mySQLSetup')
module.exports.help = {
  name: 'slot',
  group: 'fun',
  description: 'Автомат "Однорукий бандит", это такой рандом, что только бог знает как тут победить. ',
  bot_permissions: [Permissions.FLAGS.SEND_MESSAGES]
}

module.exports.run = async (client, message) => {
  const a = randomItem()
  const b = randomItem()
  const c = randomItem()
  const username = message.author.username
  const randomResult = `${a} ${b} ${c}` + ''
  const userId = message.author.id
  await setupUserData(userId, 'slot_stats')
  let win = 0
  let jackpot = 0

  if ((a === b) && (a === c) && (b === c)) {
    message.reply(`${randomResult} ${username} ВЫИГРАЛ ДЖЕКПОТ, ЭТО ВООБЩЕ ЗАКОННО?`)
    win = 1
    jackpot = 1
  } else if ((a === b) || (a === c) || (b === c)) {
    message.reply(`${randomResult} ${username} выбил 2 совпадения.`)
    win = 1
  } else {
    message.channel.send(`${randomResult} ${username} лох, он ничего не выбил.`)
  }

  const query = `UPDATE slot_stats SET total_games = total_games+1, total_wins = total_wins+${win}, jackpots = jackpots+${jackpot} WHERE user_id = ${userId}`
  mySQLconnection.query(query, function (err) {
    if (err) throw err
    // console.log("slot записан в базу");
  })
}

function randomItem () {
  const emojis = ['🍎', '🍊', '🍐', '🍋', '🍉', '🍇', '🍓', '🍒', '❤', '🚑', '💎', '🎮', '🎅']
  return emojis[Math.floor(Math.random() * emojis.length)]
}
