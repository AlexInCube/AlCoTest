const {MessageActionRow , MessageButton} = require("discord.js");
const voice = require("@discordjs/voice");
const Discord = module.require("discord.js");


/**
 * Создаёт embed сообщение с видом Аудио Плеера, но не отправляет его.
 *
 * @returns {{embeds: (Discord.MessageEmbed|Promise<Role>)[], components: MessageActionRow[]}}
 */
module.exports.createPlayer = () => {
    let musicPlayerEmbed = new Discord.MessageEmbed()//Создаём сообщение с плеером
        .setColor('#f7ee43')
        .setAuthor({name: "⌛ Загрузка ⌛"})
        .addFields(
            {name: 'Автор', value: "Неизвестно"},
            {name: 'Длительность песни', value: "Неизвестно",inline: false},
            {name: 'Оставшаяся длительность очереди', value: "Неизвестно",inline: true},
            {name: 'Осталось песен в очереди', value: "Неизвестно",inline: true},
            {name: 'Режим повтора', value: "Выключен",inline: true},
        )

    const musicPlayerRowPrimary = new MessageActionRow()//Создаём кнопки для плеера
        .addComponents(
            new MessageButton().setCustomId("stop_music").setLabel("Выключить").setStyle("DANGER"),
            new MessageButton().setCustomId("pause_music").setLabel("Пауза / Возобновить").setStyle("PRIMARY"),
            new MessageButton().setCustomId("toggle_repeat").setLabel("Переключить режим повтора").setStyle("PRIMARY"),
            new MessageButton().setCustomId("skip_song").setLabel("Пропустить").setStyle("PRIMARY"),
        )

    const musicPlayerRowSecondary = new MessageActionRow()//Создаём кнопки для плеера
        .addComponents(
            new MessageButton().setCustomId("show_queue").setLabel("Показать очередь").setStyle("SECONDARY"),
            new MessageButton().setCustomId("download_song").setLabel("Скачать песню").setStyle("SECONDARY"),
            new MessageButton().setCustomId("show_lyrics").setLabel("Показать текст песни").setStyle("SECONDARY"),
        )


    return {embeds: [musicPlayerEmbed], components: [musicPlayerRowPrimary,musicPlayerRowSecondary]}
}


const PLAYER_FIELDS = {
    author: 0,
    duration: 1,
    queue_duration: 2,
    remaining_songs: 3,
    repeat_mode: 4
}
module.exports.PLAYER_FIELDS = PLAYER_FIELDS

/**
 * Редактирует значения поля в плеере, но не отправляет изменения в сообщение в Discord
 *
 * @param guildID
 * @param field - PLAYERFIELDS.author || duration || queue_duration || remaining_songs || repeat_mode
 * @param value
 */
module.exports.editField = function editField(guildID,field,value){
    musicPlayerMap[guildID].PlayerEmbed.fields[field].value = value || "Неизвестно"
}

const PLAYER_STATES = {
    waiting: 0,
    playing: 1,
    paused: 2
}
module.exports.PLAYER_STATES = PLAYER_STATES

/**
 * Меняет состояние плеера (цвет, текст), но не отправляет изменения в сообщение в Discord
 *
 * @param guildID
 * @param state - waiting || playing || paused
 */
module.exports.setPlayerState = async (guildID , state) => {
    switch (state) {
        case PLAYER_STATES.waiting:
            await musicPlayerMap[guildID].PlayerEmbed.setTitle("").setURL("").setAuthor({name: `💿 Ожидание 💿`}).setColor('#43f7f7').setThumbnail(null);
            module.exports.editField(guildID , PLAYER_FIELDS.author, undefined)
            module.exports.editField(guildID , PLAYER_FIELDS.duration, undefined)
            module.exports.editField(guildID , PLAYER_FIELDS.queue_duration, undefined)
            module.exports.editField(guildID , PLAYER_FIELDS.remaining_songs, undefined)
            break

        case PLAYER_STATES.playing:
            await musicPlayerMap[guildID].PlayerEmbed.setAuthor({name: `🎵 Играет 🎵`}).setColor('#49f743');
            break

        case PLAYER_STATES.paused:
            await musicPlayerMap[guildID].PlayerEmbed.setAuthor({name: `⏸️ Пауза ⏸️ `}).setColor('#f74343');
            break
    }
}

/**
 * Применяем все изменения состояния плеера и полей к сообщению в Discord
 *
 * @param guildID
 * @param music_queue
 * @returns {Promise<void>}
 */
module.exports.pushChangesToPlayerMessage = async (guildID , music_queue) => {
    try {
        let message;
        let channel = await music_queue.textChannel.fetch(musicPlayerMap[guildID].ChannelID);
        if (channel){
            message = await channel.messages.fetch(musicPlayerMap[guildID].MessageID);
        }
        if (message){
            await message.edit({embeds: [musicPlayerMap[guildID].PlayerEmbed]});
        }
    } catch (e) {

    }
}

module.exports.downloadSong = async (song) => {

}

module.exports.stopPlayer = async (distube,guild) => {
    let queue = distube.getQueue(guild)
    if (queue) {
        await distube.stop(guild);
    } else {
        let vc = voice.getVoiceConnection(guild.id)
        if (vc) await voice.getVoiceConnection(guild.id).destroy()
        await musicPlayerMap[guild.id].Collector.stop()
        let channel = guild.channels.cache.get(musicPlayerMap[guild.id].ChannelID)
        await channel.messages.fetch(musicPlayerMap[guild.id].MessageID).then((m) => {
            m.delete()
        });
        delete musicPlayerMap[guild.id];
    }
}