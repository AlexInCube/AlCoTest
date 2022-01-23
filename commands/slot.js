const {Permissions} = require("discord.js");
const {setupUserData} = require("../mySQLSetup");
module.exports.help = {
    name: "slot",
    description: "Автомат \"Однорукий бандит\", это такой рандом, что только бог знает как тут победить. ",
    bot_permissions: [Permissions.FLAGS.SEND_MESSAGES]
};

module.exports.run = async (client,message) => {
    const a = randomItem()
    const b = randomItem()
    const c = randomItem()
    let username = message.author.username
    let random_result = `${a} ${b} ${c}` + "";

    let sql_query;
    let user_id = message.author.id
    await setupUserData(user_id, "slot_stats")
    let win = 0
    let jackpot = 0

    if((a === b) && (a === c) && (b === c)){
        message.reply(`${random_result} ${username} ВЫИГРАЛ ДЖЕКПОТ, ЭТО ВООБЩЕ ЗАКОННО?`);
        win = 1
        jackpot = 1
    }else if ((a === b) || (a === c) || (b === c)){
        message.reply(`${random_result} ${username} выбил 2 совпадения.`);
        win = 1
    }else{
        message.channel.send(`${random_result} ${username} лох, он ничего не выбил.`)
    }

    sql_query = `UPDATE slot_stats SET total_games = total_games+1, total_wins = total_wins+${win}, jackpots = jackpots+${jackpot} WHERE user_id = ${user_id}`
    mySQLconnection.query(sql_query, function (err) {
        if (err) throw err;
        //console.log("slot записан в базу");
    });
};

function randomItem(){
    const emojis = ["🍎","🍊","🍐","🍋","🍉","🍇","🍓","🍒","❤","🚑","💎","🎮","🎅"]
    return emojis[Math.floor(Math.random()*emojis.length)];
}