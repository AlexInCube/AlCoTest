const { PermissionsBitField, SlashCommandBuilder } = require('discord.js')
const { setupUserData } = require('../../custom_modules/mySQLSetup')
module.exports.help = {
  name: 'slot',
  group: 'fun',
  description: 'Автомат "Однорукий бандит", это такой рандом, что только бог знает как тут победить. ',
  bot_permissions: [PermissionsBitField.Flags.SendMessages]
}

module.exports.slashBuilder = new SlashCommandBuilder()
  .setName(module.exports.help.name)
  .setDescription(module.exports.help.description)

module.exports.run = async ({ interaction }) => {
  const a = randomItem()
  const b = randomItem()
  const c = randomItem()
  const username = interaction.user.username
  const randomResult = `${a} ${b} ${c}` + ''
  const userId = interaction.user.id
  await setupUserData(userId, 'slot_stats')
  let win = 0
  let jackpot = 0

  if ((a === b) && (a === c) && (b === c)) {
    interaction.reply(`${randomResult} ${username} ВЫИГРАЛ ДЖЕКПОТ, ЭТО ВООБЩЕ ЗАКОННО?`)
    win = 1
    jackpot = 1
  } else if ((a === b) || (a === c) || (b === c)) {
    interaction.reply(`${randomResult} ${username} выбил 2 совпадения.`)
    win = 1
  } else {
    interaction.reply(`${randomResult} ${username} лох, он ничего не выбил.`)
  }

  const query = `UPDATE slot_stats SET total_games = total_games+1, total_wins = total_wins+${win}, jackpots = jackpots+${jackpot} WHERE user_id = ${userId}`
  mySQLconnection.query(query, function (err) {
    if (err) throw err
    // console.log("slot записан в базу");
  })
}

function randomItem () {
  const emojis = ['👻', '🐱', '🐷', '🐻', '😈', '🐔', '🍓', '🍒', '🐨', '🚑', '💎', '🎮', '💩']
  return emojis[Math.floor(Math.random() * emojis.length)]
}
