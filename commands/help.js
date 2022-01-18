const {prefix} = require("../main");
const {Permissions} = require("discord.js");
const Discord = module.require("discord.js");

module.exports.help = {
    name: "help",
    description: "Всё таки кто-то догадался посмотреть помощь о помощи, раз ты такой умный, то возьми с полки пирожок.",
    bot_permissions: [Permissions.FLAGS.SEND_MESSAGES]
};

module.exports.run = async (client,message,args) => {
    if (args[0] === undefined){
        let commands_list = "";
        client.commands.forEach((values,keys) => {commands_list+=`\`${keys}\` `})

        let helpEmbed = new Discord.MessageEmbed()//Создаём сообщение с плеером
            .setColor('#436df7')
            .setAuthor({name: "Список команд"})
            .setTitle(`Введите ${prefix}help (название команды), чтобы узнать подробности`)
            .setDescription(commands_list)

        await message.channel.send({embeds: [helpEmbed]});
    }else{
        let command_data = client.commands.get(args[0])?.help
        if (!command_data) {await message.reply({content: "Такой команды не существует",ephemeral: true});return}
        let helpEmbed = new Discord.MessageEmbed()//Создаём сообщение с плеером
            .setColor('#436df7')
            .setTitle(prefix+command_data.name+" "+`${command_data.arguments || ""}`)
            .setDescription(command_data.description || "Описание не найдено")

        await message.channel.send({embeds: [helpEmbed]});
    }
};
