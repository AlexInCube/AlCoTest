const {MessageActionRow, MessageButton} = require("discord.js");
const Discord = module.require("discord.js");

module.exports.help = {
    name: "rps"
};

module.exports.run = async (client,message) => {
    let user_attacker = message.author;
    let user_defender = message.mentions.users.first();

    if (!user_defender){message.reply("Я не понял кого ты вызвал"); return}
    if (user_defender.bot){message.reply("С роботами играть нельзя, они тебе просто никогда не ответят, найди себе друзей."); return}
    if (user_attacker.id === user_defender.id){message.reply("Нельзя кинуть вызов самому себе"); return}

    let items = {
        rock: "🗿",
        scissors: "✂️",
        paper: "🧻"
    }

    let duelEmbed = new Discord.MessageEmbed()//Создаём сообщение с плеером
        .setColor('#ffffff')
        .setTitle(`${user_attacker.username} кинул вызов ${user_defender.username}`)
        .setDescription("Выбирай оружие и жди оппонента, на ответ даётся 10 секунд.")

    const duelButtons = new MessageActionRow()//Создаём кнопки для плеера
        .addComponents(
            new MessageButton().setCustomId("rock").setLabel(items.rock+"Камень").setStyle("PRIMARY"),
            new MessageButton().setCustomId("paper").setLabel(items.paper+"Бумага").setStyle("PRIMARY"),
            new MessageButton().setCustomId("scissors").setLabel(items.scissors+"Ножницы").setStyle("PRIMARY"),
        )

    let duelMessage = await message.channel.send({embeds: [duelEmbed], components: [duelButtons]}); // Отправляем сообщение с плеером

    let attacker_choice,defender_choice;

    const filter = i => i.customId;

    const collector = message.channel.createMessageComponentCollector({filter, time: 10000});

    collector.on('collect', async i => {
        if(i.user.id !== user_attacker.id && i.user.id !== user_defender.id){
            await i.reply({content: `Не тебе дуэль кидали, не для тебя ягодка росла.`,ephemeral: true})
            return
        }

        if (i.customId === 'rock') {
            if(i.user.id === user_attacker.id){attacker_choice = items.rock}
            if(i.user.id === user_defender.id){defender_choice = items.rock}

            await i.reply({content: `Вы выбрали ${items.rock}`,ephemeral: true})
        }
        if (i.customId === 'paper') {
            if(i.user.id === user_attacker.id){attacker_choice = items.paper}
            if(i.user.id === user_defender.id){defender_choice = items.paper}

            await i.reply({content: `Вы выбрали ${items.paper}`,ephemeral: true})
        }
        if (i.customId === 'scissors') {
            if(i.user.id === user_attacker.id){attacker_choice = items.scissors}
            if(i.user.id === user_defender.id){defender_choice = items.scissors}

            await i.reply({content: `Вы выбрали ${items.scissors}`,ephemeral: true})
        }

        if (attacker_choice !== undefined && defender_choice !== undefined){
            let resultEmbed = new Discord.MessageEmbed()//Создаём сообщение с плеером
                .setColor('#49f743')

            switch (getResult(attacker_choice,defender_choice)){
                case 1:
                    resultEmbed.setTitle(`${user_attacker.username} победил против ${user_defender.username}`)
                    break
                case 2:
                    resultEmbed.setTitle(`У ${user_defender.username} и ${user_attacker.username} вышла ничья`).setColor(`#ffffff`)
                    break
                case 0:
                    resultEmbed.setTitle(`${user_defender.username} победил против ${user_attacker.username}`)
                    break
            }

            await message.channel.send({embeds: [resultEmbed.addFields(
                    {name: `Выбор ${user_attacker.username}`, value: attacker_choice,inline: true},
                    {name: `Выбор ${user_defender.username}`, value: defender_choice,inline: true},
                )]})

            collector.stop("winner_decided")
        }
    });

    collector.on('end', async (i,reason) => {
        duelMessage.delete()
        if (reason && reason !== "winner_decided"){await message.reply("Дуэль не состоялась, время истекло")}
    });

    function getResult(attack_choice, defend_choice) {
        if(attack_choice === items.rock && defend_choice === items.scissors) {
            return 1
        } else if (attack_choice === items.paper && defend_choice === items.rock) {
            return 1
        } else if (attack_choice === items.scissors && defend_choice === items.paper){
            return 1
        } else if (attack_choice === defend_choice) {
            return 2
        } else {
            return 0
        }
    }
};
