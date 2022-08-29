const { PermissionsBitField, SlashCommandBuilder, EmbedBuilder } = require('discord.js')

module.exports.help = {
  name: 'stats',
  group: 'fun',
  arguments: '[Название команды которая вызывает игру]',
  description: 'Показывает вашу статистику в выбранной игре',
  bot_permissions: [PermissionsBitField.Flags.SendMessages]
}

module.exports.slashBuilder = new SlashCommandBuilder()
  .setName(module.exports.help.name)
  .setDescription(module.exports.help.description)
  .addStringOption(option =>
    option.setName('game')
      .setNameLocalizations({
        ru: 'игра'
      })
      .setDescription('Выберите игру по которой хотите увидеть статистику')
      .setRequired(true)
      .addChoices(
        { name: 'Однорукий бандит', value: 'slot' },
        { name: 'Камень, ножницы, бумага!', value: 'rps' }
      )
  )

module.exports.run = async ({ interaction }) => {
  const userId = interaction.user.id
  const game = interaction.options.get('game').value
  const statEmbed = new EmbedBuilder()

  await GetEmbedWithStats(game)
  await interaction.reply({ embeds: [statEmbed] })

  async function GetEmbedWithStats (game) {
    switch (game) {
      case 'slot':
        await mySQLconnection.promise().query(`SELECT total_games, total_wins, jackpots FROM slot_stats WHERE user_id = ${userId}`)
          .then(async (results) => {
            await setStatTitle('Однорукий Бандит')
            const games = results[0][0].total_games
            const wins = results[0][0].total_wins
            const jackpots = results[0][0].jackpots
            statEmbed.setFields([
              { name: 'Всего игр:', value: `${games}`, inline: true },
              {
                name: 'Победная:',
                value: 'Всего побед: ' + `${wins}` + `\nПроцент побед: ${Math.round(wins / games * 100)}%`
              },
              { name: 'Джекпотов:', value: `${jackpots}`, inline: true }
            ])
          })
          .catch(async () => {
            await interaction.reply('Ты ещё ни разу не играл в эту игру')
          })
        break
      case 'rps':
        await mySQLconnection.promise().query(`SELECT total_games, wins, draws FROM rps_stats WHERE user_id = ${userId}`)
          .then(async (results) => {
            await setStatTitle('Камень, ножницы, бумага!')
            const games = results[0][0].total_games
            const wins = results[0][0].wins
            const draws = results[0][0].draws
            statEmbed.setFields([
              { name: 'Всего игр:', value: `${games}`, inline: true },
              {
                name: 'Победная:',
                value: 'Всего побед: ' + `${wins}` + `\nПроцент побед: ${Math.round(wins / games * 100)}%`
              },
              { name: 'Ничьих:', value: `${draws}`, inline: true }
            ])
          })
          .catch(async () => {
            await interaction.reply('Ты ещё ни разу не играл в эту игру')
          })
        break
    }
  }

  async function setStatTitle (gameName) {
    await statEmbed.setTitle(`Статистика ${interaction.user.username} по игре "${gameName}"`)
  }
}
