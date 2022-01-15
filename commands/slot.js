module.exports.help = {
    name: "slot",
    description: "Автомат \"Однорукий бандит\", это такой рандом, что хер его знает как тут победить. "
};

module.exports.run = async (client,message) => {
    const a = randomItem()
    const b = randomItem()
    const c = randomItem()
    let username = message.author.username
    let random_result = `${a} ${b} ${c}` + "";

    if((a === b) && (a === c) && (b === c)){
        message.reply(`${random_result} ${username} ВЫИГРАЛ ДЖЕКПОТ, ЭТО ВООБЩЕ ЗАКОННО?`);
    }else if ((a === b) || (a === c) || (b === c)){
        message.reply(`${random_result} ${username} выбил 2 совпадения.`);
    }else{
        message.channel.send(`${random_result} ${username} лох, он ничего не выбил.`)
    }
};

function randomItem(){
    const emojis = ["🍎","🍊","🍐","🍋","🍉","🍇","🍓","🍒","❤","🚑","💎","🎮","🎅"]
    return emojis[Math.floor(Math.random()*emojis.length)];
}