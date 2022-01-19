const {distube} = require("../main");
const {Permissions} = require("discord.js");
module.exports.help = {
    name: "move",
    arguments: "позиция в очереди",
    description: "Пропускает все песни до указанной позиции. Чтобы узнать позицию песни, нажмите \"Показать очередь\" в проигрывателе",
    bot_permissions: [Permissions.FLAGS.SEND_MESSAGES]
};

module.exports.run = async (client,message,args) => {
    if(!distube.getQueue(message.guild)){await message.reply("Никакой очереди не существует"); return}
    const move_number = parseInt(args[0])
    if(isNaN(move_number)){await message.reply("Это не число"); return}
    try{
        await distube.jump(message.guild,move_number)
        await message.reply("Очередь перемещена")
    }catch (e) {
        await message.reply("Неверный номер песни")
    }
};
