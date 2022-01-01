const Discord = module.require("discord.js");
const fs = require("fs");

module.exports.help = {
    name: "command_name"
};

module.exports.run = async (client,message,args) => {
    message.channel.send("Вывод");
};
