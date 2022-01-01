const Discord = module.require("discord.js");
const fs = require("fs");

module.exports.help = {
    name: "hello" // Название команды
};

module.exports.run = async (client,message) => {

    const exampleEmbed = new Discord.MessageEmbed() // Создаём наш эмбэд
        .setColor('#43e2f7') // Цвет нашего сообщения
        .setTitle(`Здарова ${message.author.username} :)`) // Название эмбэд сообщения
        .setAuthor(message.guild.name) // Автором будет название сервера
        .setDescription(':^Мы любим вас!^:') // комментарий
        .setTimestamp() // Дата  отправки сообщения
        .setFooter(`Ваш бот ${client.user.username} © 2021`);

    message.channel.send({embeds: [exampleEmbed]}); // Отправляем сообщение

};
