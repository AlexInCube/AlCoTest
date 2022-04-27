const { MessageActionRow, MessageButton, Permissions } = require('discord.js')
const { setupUserData } = require('../../custom_modules/mySQLSetup')
const Discord = module.require('discord.js')

module.exports.help = {
  name: 'rps',
  group: 'fun',
  arguments: '(@имя_соперника)',
  description: 'Киньте вызов в "Камень, Ножницы, Бумага!" против любого человека и уничтожьте своего врага!',
  bot_permissions: [Permissions.FLAGS.SEND_MESSAGES]
}

module.exports.run = async (client, message) => {
  const userAttacker = message.author
  const userDefender = message.mentions.users.first()

  if (!userDefender) { message.reply('Я не понял кого ты вызвал'); return }
  if (userDefender.bot) { message.reply('С роботами играть нельзя, они тебе просто никогда не ответят, найди себе друзей.'); return }
  if (userAttacker.id === userDefender.id) { message.reply('Нельзя кинуть вызов самому себе'); return }

  const items = {
    rock: '🗿',
    scissors: '✂️',
    paper: '🧻'
  }

  const duelEmbed = new Discord.MessageEmbed()
    .setColor('#ffffff')
    .setTitle(`${userAttacker.username} кинул вызов ${userDefender.username}`)
    .setDescription('Выбирай оружие и жди оппонента, на ответ даётся 10 секунд.')

  const duelButtons = new MessageActionRow()
    .addComponents(
      new MessageButton().setCustomId('rock').setLabel(items.rock + 'Камень').setStyle('PRIMARY'),
      new MessageButton().setCustomId('paper').setLabel(items.paper + 'Бумага').setStyle('PRIMARY'),
      new MessageButton().setCustomId('scissors').setLabel(items.scissors + 'Ножницы').setStyle('PRIMARY')
    )

  const duelMessage = await message.channel.send({ embeds: [duelEmbed], components: [duelButtons] }) // Отправляем сообщение с плеером

  let attackerChoice, defenderChoice

  const filter = i => i.customId

  const collector = message.channel.createMessageComponentCollector({ filter, time: 10000 })

  collector.on('collect', async i => {
    if (i.user.id !== userAttacker.id && i.user.id !== userDefender.id) {
      await i.reply({ content: 'Не тебе дуэль кидали, не для тебя ягодка росла.', ephemeral: true })
      return
    }

    if (i.customId === 'rock') {
      if (i.user.id === userAttacker.id) { attackerChoice = items.rock }
      if (i.user.id === userDefender.id) { defenderChoice = items.rock }

      await i.reply({ content: `Вы выбрали ${items.rock}`, ephemeral: true })
    }

    if (i.customId === 'paper') {
      if (i.user.id === userAttacker.id) { attackerChoice = items.paper }
      if (i.user.id === userDefender.id) { defenderChoice = items.paper }

      await i.reply({ content: `Вы выбрали ${items.paper}`, ephemeral: true })
    }

    if (i.customId === 'scissors') {
      if (i.user.id === userAttacker.id) { attackerChoice = items.scissors }
      if (i.user.id === userDefender.id) { defenderChoice = items.scissors }

      await i.reply({ content: `Вы выбрали ${items.scissors}`, ephemeral: true })
    }

    if (attackerChoice !== undefined && defenderChoice !== undefined) {
      await setupUserData(userAttacker.id, 'rps_stats')
      await setupUserData(userDefender.id, 'rps_stats')

      const resultEmbed = new Discord.MessageEmbed()// Создаём сообщение с плеером
        .setColor('#49f743')

      let attackerQuery = ''; let defenderQuery = ''
      switch (getResult(attackerChoice, defenderChoice)) {
        case 0:
          resultEmbed.setTitle(`${userDefender.username} победил(-а) против ${userAttacker.username}`)
          attackerQuery = `UPDATE rps_stats SET total_games = total_games+1 WHERE user_id = ${userAttacker.id}`
          defenderQuery = `UPDATE rps_stats SET total_games = total_games+1, wins = wins+1  WHERE user_id = ${userDefender.id}`
          break
        case 1:
          resultEmbed.setTitle(`${userAttacker.username} победил(-а) против ${userDefender.username}`)
          attackerQuery = `UPDATE rps_stats SET total_games = total_games+1, wins = wins+1 WHERE user_id = ${userAttacker.id}`
          defenderQuery = `UPDATE rps_stats SET total_games = total_games+1 WHERE user_id = ${userDefender.id}`
          break
        case 2:
          resultEmbed.setTitle(`У ${userDefender.username} и ${userAttacker.username} вышла ничья`).setColor('#ffffff')
          attackerQuery = `UPDATE rps_stats SET total_games = total_games+1, draws = draws + 1  WHERE user_id = ${userAttacker.id}`
          defenderQuery = `UPDATE rps_stats SET total_games = total_games+1, draws = draws + 1 WHERE user_id = ${userDefender.id}`
          break
      }

      mySQLconnection.query(attackerQuery, function (err) {
        if (err) throw err
      })

      mySQLconnection.query(defenderQuery, function (err) {
        if (err) throw err
      })

      await message.channel.send({
        embeds: [resultEmbed.addFields(
          { name: `Выбор ${userAttacker.username}`, value: attackerChoice, inline: true },
          { name: `Выбор ${userDefender.username}`, value: defenderChoice, inline: true }
        )]
      })

      collector.stop('winner_decided')
    }
  })

  collector.on('end', async (i, reason) => {
    duelMessage.delete()
    if (reason && reason !== 'winner_decided') { await message.reply('Дуэль не состоялась, время истекло') }
  })

  function getResult (attackChoice, defenderChoice) {
    if (attackChoice === items.rock && defenderChoice === items.scissors) {
      return 1
    } else if (attackChoice === items.paper && defenderChoice === items.rock) {
      return 1
    } else if (attackChoice === items.scissors && defenderChoice === items.paper) {
      return 1
    } else if (attackChoice === defenderChoice) {
      return 2
    } else {
      return 0
    }
  }
}
