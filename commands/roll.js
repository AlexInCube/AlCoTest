const {Permissions} = require("discord.js");

module.exports.help = {
    name: "roll",
    arguments: "[максимальное/минимальное число] [максимальное число]",
    description: "Выбирается случайное число из указанного диапазона, по умолчанию число 100",
    bot_permissions: [Permissions.FLAGS.SEND_MESSAGES]
};

module.exports.run = async (client,message,args) => {
    let roll_content = "Ошибка, хрен пойми какая.";
    switch (args.length){
        case 0:
            roll_content = Math.floor(Math.random() * 100);
            break
        case 1:
            args[0] = parseInt(args[0]);
            roll_content = Math.floor(Math.random() * args[0]);
            break
        case 2://arg0 - минимум, arg1 - максимум
            args[0] = parseInt(args[0]);
            args[1] = parseInt(args[1]);
            roll_content = Math.floor(Math.random() * (args[1] - args[0]) ) + args[0];
            break
    }
    if (isNaN(roll_content)){
        roll_content = 'Это должно быть числом!';
    }

    message.channel.send({ content: `${roll_content}`});
}