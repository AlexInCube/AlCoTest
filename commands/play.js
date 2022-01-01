const Discord = module.require("discord.js");
const fs = require("fs");
const {distube} = require("../main");
const {MessageActionRow, MessageButton} = require("discord.js");
const {joinVoiceChannel} = require("@discordjs/voice");
const {getCurrentTimestamp, isUserConnectedToSameVoice} = require("../tools");

module.exports.help = {
    name: "play"
};

module.exports.run = async (client,message,args) => {
    //Пытаемся устранить все ошибки пользователя
    if (!message.member.voice.channel) {message.reply("Зайди сначала в голосовой канал"); return}
    if (args[0] === undefined) {message.reply("А что ты слушать хочешь, то а? Укажи хоть что-нибудь.");return}
    if (args[0] === ""){message.reply("Ты как-то неправильно ввёл название, попробуй ещё раз."); return}
    //Получаем очередь
    let music_queue = distube.getQueue(message);
    let guildID = message.guildId;

    if(music_queue !== undefined && musicPlayerMap[guildID]) {
        await distube.play(message, args[0])
        return
    }

    let musicPlayerEmbed = new Discord.MessageEmbed()//Создаём сообщение с плеером
        .setColor('#f7ee43')
        .setAuthor("⌛ Загрузка ⌛")
        .addFields(
            { name: 'Автор: ', value: 'Никто' },
            { name: 'Длительность: ', value: '0' },
        )

    const row = new MessageActionRow()//Создаём кнопки для плеера
        .addComponents(
            new MessageButton().setCustomId("stop_music").setLabel("Выключить").setStyle("DANGER"),
            new MessageButton().setCustomId("pause_music").setLabel("Пауза / Возобновить").setStyle("PRIMARY"),
            new MessageButton().setCustomId("skip_song").setLabel("Пропустить").setStyle("PRIMARY"),
            new MessageButton().setCustomId("show_queue").setLabel("Показать очередь").setStyle("PRIMARY"),
        )


    let musicPlayerMessage = await message.channel.send({embeds: [musicPlayerEmbed], components: [row]}); // Отправляем сообщение с плеером
    musicPlayerMap[guildID] = {MessageID: musicPlayerMessage.id, ChannelID: musicPlayerMessage.channel_id, PlayerEmbed: musicPlayerEmbed}

    await distube.play(message, args[0])

    const filter = button => button.customId;

    const collector = musicPlayerMessage.channel.createMessageComponentCollector({filter});

    const button_function = (async button => {
        if (!isUserConnectedToSameVoice(message,button)){
            await button.message.channel.send({content: `${button.user.username} попытался нажать на кнопки, но он не в голосовом чате со мной!`})
            return
        }

        if (button.customId === 'stop_music') {
            await distube.stop(message);
            collector.off('collect',button_function);
            delete musicPlayerMap[guildID];
            await button.message.delete();
        }

        if (button.customId === 'pause_music') {
            let pause = distube.getQueue(message).paused;
            if (pause) {
                await distube.resume(message);
                musicPlayerMap[guildID].PlayerEmbed.setAuthor(`🎵 Играет 🎵`).setColor('#49f743');
            } else {
                await distube.pause(message);
                musicPlayerMap[guildID].PlayerEmbed.setAuthor(`⏸ Пауза ⏸`).setColor('#f74343');
            }

            await button.update({embeds: [musicPlayerMap[guildID].PlayerEmbed]});
        }

        if (button.customId === 'skip_song') {
            await button.deferUpdate();
            try {
                await distube.skip(message);
                await button.message.channel.send("Пропущено")
                let pause = distube.getQueue(message).paused;
                if (pause) {
                    await distube.resume(message);
                    musicPlayerMap[guildID].PlayerEmbed.setAuthor(`🎵 Играет 🎵`).setColor('#49f743');
                }
            } catch (e) {
                await button.message.channel.send("В очереди дальше ничего нет");
                return;
            }
        }

        if (button.customId === 'show_queue') {
            const queue = distube.getQueue(message);
            if (!queue) {
                await button.reply({content: 'Ничего не проигрывается', ephemeral: true})
            } else {
                await button.reply({content: `Текущая очередь:\n${queue.songs
                        .map(
                            (song, id) =>
                                `**${id ? id : 'Сейчас играет'}**. ${song.name} - \`${
                                    song.formattedDuration
                                }\``,
                        )
                        .slice(0, 10)
                        .join('\n')}`, ephemeral: true}
                )
            }
        }
    });

    collector.on('collect', button_function)
};
