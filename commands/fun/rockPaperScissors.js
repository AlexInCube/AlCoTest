const { PermissionsBitField, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const { setupUserData } = require('../../custom_modules/mySQLSetup')

module.exports.help = {
  name: 'rps',
  group: 'fun',
  arguments: '(пользователь с сервера)',
  description: 'Киньте вызов в "Камень, Ножницы, Бумага!" против любого человека и уничтожьте своего врага!',
  bot_permissions: [PermissionsBitField.Flags.SendMessages],
  guild_only: true
}

module.exports.slashBuilder = new SlashCommandBuilder()
  .setName(module.exports.help.name)
  .setDescription('Киньте вызов в "Камень, Ножницы, Бумага!" против любого человека и уничтожьте своего врага!')
  .addUserOption(option =>
    option
      .setName('user')
      .setNameLocalizations({
        ru: 'пользователь'
      })
      .setDescription('Пользователь которому нужно кинуть вызов')
      .setRequired(true)
  )

module.exports.run = async ({ client, interaction, channel }) => {
  const userAttacker = interaction.member.user
  const userDefender = client.users.cache.get(interaction.options.get('user').value)

  if (!userDefender) { interaction.reply({ content: 'Я не понял кого ты вызвал', ephemeral: true }); return }
  if (userDefender.bot) { interaction.reply({ content: 'С роботами играть нельзя, они тебе просто никогда не ответят, найди себе друзей.', ephemeral: true }); return }
  if (userAttacker.id === userDefender.id) { interaction.reply({ content: 'Нельзя кинуть вызов самому себе', ephemeral: true }); return }

  const items = {
    rock: '🗿',
    scissors: '✂️',
    paper: '🧻'
  }

  const duelEmbed = new EmbedBuilder()
    .setColor('#ffffff')
    .setTitle(`${userAttacker.username} кинул вызов ${userDefender.username}`)
    .setDescription('Выбирай оружие и жди оппонента, на ответ даётся 10 секунд.')

  const duelButtons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder().setCustomId('rock').setLabel(items.rock + 'Камень').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('paper').setLabel(items.paper + 'Бумага').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('scissors').setLabel(items.scissors + 'Ножницы').setStyle(ButtonStyle.Primary)
    )

  await interaction.reply({ embeds: [duelEmbed], components: [duelButtons] })

  let attackerChoice, defenderChoice

  const filter = i => i.customId

  const collector = channel.createMessageComponentCollector({ filter, time: 10000 })

  collector.on('collect', async i => {
    if (i.user.id !== userAttacker.id && i.user.id !== userDefender.id) {
      await i.reply({ content: 'Не тебе дуэль кидали, не для тебя ягодка росла.', ephemeral: true })
      return
    }

    if (i.customId === 'rock') {
      await setItem(i, items.rock)
    }

    if (i.customId === 'paper') {
      await setItem(i, items.paper)
    }

    if (i.customId === 'scissors') {
      await setItem(i, items.scissors)
    }

    if (attackerChoice !== undefined && defenderChoice !== undefined) {
      await setupUserData(userAttacker.id, 'rps_stats')
      await setupUserData(userDefender.id, 'rps_stats')

      const resultEmbed = new EmbedBuilder()// Создаём сообщение с плеером
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

      const channel = client.channels.cache.get(interaction.channelId)
      await channel.send({
        embeds: [resultEmbed.addFields(
          { name: `Выбор ${userAttacker.username}`, value: attackerChoice, inline: true },
          { name: `Выбор ${userDefender.username}`, value: defenderChoice, inline: true }
        )]
      })

      collector.stop('winner_decided')
    }
  })

  collector.on('end', async (i, reason) => {
    if (reason && reason !== 'winner_decided') { await interaction.deleteReply(); await channel.send('Дуэль не состоялась, время истекло') }
  })

  async function setItem (buttonInteraction, item) {
    if (buttonInteraction.user.id === userAttacker.id) { attackerChoice = item }
    if (buttonInteraction.user.id === userDefender.id) { defenderChoice = item }

    await buttonInteraction.reply({ content: `Вы выбрали ${items.scissors}`, ephemeral: true })
  }

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
