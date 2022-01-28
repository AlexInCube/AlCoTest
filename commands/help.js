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
            .setTitle(`Введите ${prefix}help (название команды), чтобы узнать подробности`)
            .setDescription('Обозначения в аргументах команд:\n() - обязательно\n[] - по желанию')
            .addField('Список команд: ', commands_list, true)

        await message.channel.send({embeds: [helpEmbed]});
    }else{
        let command_data = client.commands.get(args[0])?.help
        if (!command_data) {await message.reply({content: "Такой команды не существует",ephemeral: true});return}

        let permissions_string = ""
        const bot = message.guild.members.cache.get(client.user.id)//client.users.fetch(client.user.id)

        command_data.bot_permissions.forEach(function(value){
            if(bot.permissions.has(value)){
                permissions_string += "✅"
            }else{
                permissions_string += "❌"
            }
            permissions_string += "  "+convertPermissionsToLocaleString(value)+"\n"
        })

        let helpEmbed = new Discord.MessageEmbed()//Создаём сообщение с плеером
            .setColor('#436df7')
            .setTitle(prefix+command_data.name+" "+`${command_data.arguments || ""}`)
            .setDescription(command_data.description || "Описание не найдено")
            .addFields(
                {name: 'Права требуемые для БОТА, не для пользователя: ', value: permissions_string || "Права не требуются"},
            )

        await message.channel.send({embeds: [helpEmbed]});
    }

    function convertPermissionsToLocaleString(permission){
        switch (permission){
            case Permissions.FLAGS.SEND_MESSAGES: return "Отправлять сообщения";
            case Permissions.FLAGS.MANAGE_MESSAGES: return "Управлять сообщениями";
            case Permissions.FLAGS.CONNECT: return "Подключаться";
            case Permissions.FLAGS.SPEAK: return "Говорить";
            case Permissions.FLAGS.VIEW_CHANNEL: return "Просматривать каналы";
            case Permissions.FLAGS.ATTACH_FILES: return "Прикреплять файлы";
            default: return "Не найдено название прав: "+permission;
        }
    }
};
