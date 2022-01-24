const {Permissions} = require("discord.js");
const {distube} = require("../main");
module.exports.help = {
    name: "shuffle",
    arguments: "",
    description: "Перемешивает все песни в очереди",
    bot_permissions: [Permissions.FLAGS.SEND_MESSAGES]
};

module.exports.run = async (client,message) => {
    let queue = distube.getQueue(message)
    if(queue) {
        await distube.shuffle(queue)
        message.channel.send("Все песни в очереди перемешаны");
    }else{
        message.channel.send("Очереди не существует");
    }
};
