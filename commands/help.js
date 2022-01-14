module.exports.help = {
    name: "help"
};

module.exports.run = async (client,message,args) => {
    if (args[0] === undefined){
        let helpEmbed = new Discord.MessageEmbed()//Создаём сообщение с плеером
            .setColor('#436df7')
            .setAuthor("Справ")
            .setDescription("")

        message.channel.send({embeds: [helpEmbed]});
    }
};
