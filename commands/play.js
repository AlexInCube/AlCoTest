const Discord = module.require("discord.js");
require("fs");
const {distube} = require("../main");
const {MessageActionRow, MessageButton} = require("discord.js");
const {isValidURL} = require("../tools");
const {RepeatMode} = require("distube");
const {getVoiceConnection} = require("@discordjs/voice");

module.exports.help = {
    name: "play"
};

module.exports.run = async (client,message,args) => {

    //Пытаемся устранить все ошибки пользователя
    if (!message.member.voice.channel) {message.reply("Зайди сначала в голосовой канал"); return}

    let user_search;

    if (message.attachments){
        user_search = message.attachments.first().url
        if(user_search.endsWith(".mp3") || user_search.endsWith(".wav") || user_search.endsWith(".ogg")){

        }else{
            message.reply("Это не аудиофайл, это чёрт пойми что!");return
        }
    }else{
        if (args[0] === undefined) {message.reply("А что ты слушать хочешь, то а? Укажи хоть что-нибудь.");return}
        if (args[0] === ""){message.reply("Ты как-то неправильно ввёл название, попробуй ещё раз."); return}


        args.forEach((item) => {
            user_search += item;
        })
    }


    let songToPlay;
    let music_queue = distube.getQueue(message);
    let guildID = message.guildId;

    if (isValidURL(user_search)){
        songToPlay = user_search
        //Получаем очередь
        await startPlayer()
    }else{
        await searchSong()
    }

    async function searchSong() {
        //Ищем музыку
        let foundSongs
        try {
            foundSongs = await distube.search(user_search, {limit: 10}).then(function (result) {
                return result
            });
        }catch (e){
            await message.reply("Ничего не найдено")
            return
        }

        let foundSongsFormattedList = "";

        foundSongs.forEach((item, index) => {
            foundSongsFormattedList += `**${index + 1}**.  ` + `[${item.name}](${item.url})` + " — " + ` \`${item.formattedDuration}\` ` + "\n"
        })

        let foundSongsEmbed = new Discord.MessageEmbed()
            .setColor('#436df7')
            .setAuthor("Результаты поиска")
            .setTitle(`Напишите число песни (без префикса //), чтобы выбрать её, у вас есть 30 секунд!`)
            .setDescription(foundSongsFormattedList)

        let filter = m => m.author.id === message.author.id;

        await message.channel.send({embeds: [foundSongsEmbed], ephemeral: true}).then(() => {
            message.channel.awaitMessages({
                filter,
                max: 1,
                time: 30000,
                errors: ['time']
            }).then(message => {
                message = message.first()
                let parsedSelectedSong = parseInt(message.content);
                if (!isNaN(parsedSelectedSong)) {
                    songToPlay = foundSongs[parsedSelectedSong - 1]
                    message.reply({content: foundSongs[parsedSelectedSong - 1].name})
                    startPlayer()
                } else {
                    message.reply(`Вы указали что-то неверное, а нужно было число!`)
                }
            })
                .catch(() => {
                    message.reply('Вы ничего не выбрали');
                });
        })
    }

    async function startPlayer() {
        if (music_queue !== undefined && musicPlayerMap[guildID]) {
            await distube.play(message, songToPlay);
            return
        }

        let musicPlayerEmbed = new Discord.MessageEmbed()//Создаём сообщение с плеером
            .setColor('#f7ee43')
            .setAuthor("⌛ Загрузка ⌛")
            .addFields(
                {name: 'Автор', value: "Неизвестно"},
                {name: 'Длительность песни', value: "Неизвестно",inline: false},
                {name: 'Оставшаяся длительность очереди', value: "Неизвестно",inline: true},
                {name: 'Осталось песен в очереди', value: "Неизвестно",inline: true},
                {name: 'Режим повтора', value: "Выключен",inline: true},
            )

        const musicPlayerRow = new MessageActionRow()//Создаём кнопки для плеера
            .addComponents(
                new MessageButton().setCustomId("stop_music").setLabel("Выключить").setStyle("DANGER"),
                new MessageButton().setCustomId("pause_music").setLabel("Пауза / Возобновить").setStyle("PRIMARY"),
                new MessageButton().setCustomId("toggle_repeat").setLabel("Переключить режим повтора").setStyle("PRIMARY"),
                new MessageButton().setCustomId("skip_song").setLabel("Пропустить").setStyle("PRIMARY"),
                new MessageButton().setCustomId("show_queue").setLabel("Показать очередь").setStyle("SECONDARY"),
            )


        let musicPlayerMessage = await message.channel.send({embeds: [musicPlayerEmbed], components: [musicPlayerRow]}); // Отправляем сообщение с плеером
        musicPlayerMap[guildID] = {
            MessageID: musicPlayerMessage.id,
            ChannelID: musicPlayerMessage.channel_id,
            PlayerEmbed: musicPlayerEmbed
        }

        await distube.play(message, songToPlay)

        filter = button => button.customId;

        const collector = musicPlayerMessage.channel.createMessageComponentCollector({filter});


        collector.on('collect', (async button => {
            let connection = getVoiceConnection(message.guildId)

            if (!connection && connection.joinConfig.channelId !== button.member.voice.channelId) {
                await button.message.channel.send({content: `${button.user.username} попытался нажать на кнопки, но он не в голосовом чате со мной!`})
                return
            }

            if(!button.member.permissions.has('MANAGE_GUILD') && !button.member.roles.cache.some(role => role.name === 'DJEban') && button.user.id !== message.author.id && message.guild.me.voice.channel.members.size > 2){
                await button.message.channel.send({content: "У тебя нехватает прав на нажатие кнопок плеера", ephemeral: true})
                return
            }

            if (button.customId === 'stop_music') {
                if (distube.getQueue(message)){
                    await distube.stop(message);
                }
                collector.stop()
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

            if (button.customId === 'toggle_repeat') {
                let queue = distube.getQueue(message)
                if(queue) {
                    let repeat = queue.repeatMode;
                    let mode;
                    switch (repeat) {
                        case RepeatMode.DISABLED:
                            queue.setRepeatMode(1)
                            mode = "Песня";
                            break;
                        case RepeatMode.SONG:
                            queue.setRepeatMode(2)
                            mode = "Очередь";
                            break;
                        case RepeatMode.QUEUE:
                            queue.setRepeatMode(0)
                            mode = "Выключен";
                            break;
                    }

                    musicPlayerMap[guildID].PlayerEmbed.fields[4].value = mode
                }
                await button.update({embeds: [musicPlayerMap[guildID].PlayerEmbed]});
            }

            if (button.customId === 'skip_song') {
                await button.deferUpdate();
                try {
                    await distube.skip(message);
                    //await button.message.channel.send("Пропущено")
                    let pause = distube.getQueue(message).paused;
                    if (pause) {
                        await distube.resume(message);
                        musicPlayerMap[guildID].PlayerEmbed.setAuthor(`🎵 Играет 🎵`).setColor('#49f743');
                    }
                } catch (e) {
                    await button.message.channel.send({content: "В очереди дальше ничего нет", ephemeral: true});
                    return;
                }
            }

            if (button.customId === 'show_queue') {
                const queue = distube.getQueue(message);
                if (!queue) {
                    await button.reply({content: 'Ничего не проигрывается', ephemeral: true})
                } else {
                    await button.reply({
                            content: `Текущая очередь:\n**Сейчас играет: **${queue.songs
                                .map(
                                    (song,id) =>
                                        `${id}. ${song.name} - \`${
                                            song.formattedDuration
                                        }\``,
                                )
                                .join('\n')}`, ephemeral: true
                        }
                    )
                    /*
                    let queueMessage = await button.fetchReply();
                    await queueMessage.react('⬅️')
                    await queueMessage.react('➡️')*/
                }
            }
        }));
    }
};
