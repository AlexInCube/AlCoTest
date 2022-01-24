const {Permissions, MessageEmbed} = require("discord.js");
module.exports.help = {
    name: "stats",
    arguments: "Название игры (команда которая вызывает игру)",
    description: "Показывает вашу статистику в какой-то из игр. К примеру //stats slot",
    bot_permissions: [Permissions.FLAGS.SEND_MESSAGES]
};

module.exports.run = async (client,message, args) => {
    let user_id = message.author.id
    let statEmbed = new MessageEmbed()

    switch (args[0]) {
        case "slot":
            mySQLconnection.promise().query(`SELECT total_games, total_wins, jackpots FROM slot_stats WHERE user_id = ${user_id}`)
                .then(async (results) =>
                {
                    await setStatTitle("Однорукий Бандит")
                    let games = results[0][0].total_games;let wins = results[0][0].total_wins;
                    statEmbed.addField('Всего игр:', `${games}`, true)
                    statEmbed.addField('Победная:', "Всего побед: "+`${wins}`+`\nПроцент побед: ${Math.round(wins/games*100)}%`, true)
                    statEmbed.addField('Джекпотов:', `${results[0][0].jackpots}`, true)
                    await message.channel.send({embeds: [statEmbed]});
                })
                .catch(() => {
                    message.reply("Ты ещё ни разу не играл в эту игру")
                })
            break
        case "rps":
            mySQLconnection.promise().query(`SELECT total_games, wins, draws FROM rps_stats WHERE user_id = ${user_id}`)
                .then(async (results) =>
                {
                    await setStatTitle("Камень, ножницы, бумага!")
                    let games = results[0][0].total_games;let wins = results[0][0].wins;
                    statEmbed.addField('Всего игр:', `${games}`, true)
                    statEmbed.addField('Победная:', "Всего побед: "+`${wins}`+`\nПроцент побед: ${Math.round(wins/games*100)}%`, true)
                    statEmbed.addField('Ничьих:', `${results[0][0].draws}`, true)
                    await message.channel.send({embeds: [statEmbed]});
                })
                .catch(async () => {
                    await message.reply("Ты ещё ни разу не играл в эту игру")
                })
            break
        default:
            await message.reply("Такой статистики не существует")
            return
    }

    async function setStatTitle(game_name) {
        await statEmbed.setTitle(`Статистика ${message.author.username} по игре \"${game_name}\"`)
    }
};
