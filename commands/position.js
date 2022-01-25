const {Permissions} = require("discord.js");
const {distube} = require("../main");
module.exports.help = {
    name: "position",
    arguments: "(время)",
    description: "Меняет позицию с которой проигрывается песня. К примеру 3h 20m 15s",
    bot_permissions: [Permissions.FLAGS.SEND_MESSAGES]
};

module.exports.run = async (client,message, args) => {
    message.channel.send("Вывод"+args);
    if (!args){message.reply({content: "А время указать? Не понимаешь как? Пиши //help position"});return}

    let totalTime = 0
    args.forEach((arg => {
        totalTime += parseTime(arg)
    }))

    if(!Number.isInteger(totalTime)){message.reply({content: "Я не понял что ты написал"});return}

    message.reply({content: `Время изменено на ${totalTime} секунд`})
    distube.seek(distube.getQueue(message),totalTime)

    function parseTime(time) {
        const last_time_symbol = time.charAt(time.length - 1)
        try {
            time = parseInt(time.slice(0, -1))
            switch (last_time_symbol) {
                case "h":
                    return time*60*60
                case "m":
                    return time*60
                case "s":
                    return time
                default:
                    return 0
            }
        } catch (e){
            return undefined
        }
    }
};
