const {Permissions} = require("discord.js");
module.exports.help = {
    name: "command_name",
    arguments: "",
    description: "",
    bot_permissions: [Permissions.FLAGS.SEND_MESSAGES]
};

module.exports.run = async (client,message, args) => {
    message.channel.send("Вывод"+args);
};
