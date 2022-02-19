const Discord = require("discord.js");
const config = require("config");
const prefix = config.get('BOT_PREFIX');
const fs = require('fs') // подключаем fs к файлу
const {getCurrentTimestamp} = require("./tools");
const {mySQLSetup} = require("./mySQLSetup");
const { Permissions } = require('discord.js');


process.on('uncaughtException', function (err) {
    console.error(getCurrentTimestamp() + "Uncaught Exception" + err.stack);
});

mySQLSetup()

const client = new Discord.Client({
    intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_VOICE_STATES", "GUILD_MESSAGE_REACTIONS"],
    restTimeOffset: 0,
    shards: "auto"
});


client.commands = new Discord.Collection() // создаём коллекцию для команд

//Находим имена команд (имя файла.js) и собираем их в коллекцию.
fs.readdir('./commands', (err, files) => { // чтение файлов в папке commands
    if (err) console.log(getCurrentTimestamp()+err)

    let jsfile = files.filter(f => f.split('.').pop() === 'js') // файлы не имеющие расширение .js игнорируются
    if (jsfile.length <= 0) return console.log(getCurrentTimestamp()+'Команды не найдены!') // если нет ни одного файла с расширением .js

    console.log(getCurrentTimestamp()+`Загружено ${jsfile.length} команд`)
    jsfile.forEach((f) => { // добавляем каждый файл в коллекцию команд
        let props = require(`./commands/${f}`)
        client.commands.set(props.help.name, props)
    })
})

//Когда бот запустился
client.on('ready', () => {
    console.log(getCurrentTimestamp()+`Бот ${client.user.username} запустился`);
    client.user.setActivity('Напиши //help');
})

//Преобразование введённых сообщений в команды
client.on("messageCreate", function(message) {
    if (message.author.bot) return;//Если автор сообщения бот, тогда не обрабатываем его.
    if (!message.content.startsWith(prefix)) return;//Проверка префикса сообщения

    const commandBody = message.content.slice(prefix.length);
    let args = commandBody.split(' ');
    const command = args.shift().toLowerCase();

    if (!args) {args = []}

    let command_file = client.commands.get(command) // получение команды из коллекции
    try {
        if (command_file){
            if (!CheckAllNecessaryPermission(message, command_file.help.bot_permissions)){return}
            command_file.run(client, message, args)
        } else {
            message.reply("Команды не существует")
        }
    }catch (e) {
        console.log(`${e.stack}`.slice(0,2000))
    }
});

//Музыкальный блок
global.musicPlayerMap = {}
const DisTubeLib = require("distube")
const { SpotifyPlugin } = require("@distube/spotify");
const lyricsFinder = require('lyrics-finder');
const Audioplayer = require("./audio_player/Audioplayer");
const {PLAYER_STATES , PLAYER_FIELDS} = require("./audio_player/Audioplayer");

const distube = new DisTubeLib.default(client,{
    searchSongs: 0,
    leaveOnEmpty: true,
    emptyCooldown: 30,
    leaveOnFinish: false,
    leaveOnStop: true,

    updateYouTubeDL: false,
    youtubeCookie: config.get("YOUTUBE_COOKIE"),

    plugins: [
        new SpotifyPlugin(
            {
                parallel: true,
                emitEventsAfterFetching: true,
                api:{
                    clientId: config.get("SPOTIFY_CLIENT_ID"),
                    clientSecret: config.get("SPOTIFY_CLIENT_SECRET")
                }
            })
    ],
})


distube
    .on('error', (textChannel, e) => {
        console.error(e)
        textChannel.send(`Произошла ошибка: ${e.stack}`.slice(0, 2000))
    })
    .on('playSong', async (music_queue, song) => {
        let guild = music_queue.textChannel.guildId;
        await Audioplayer.setPlayerState(guild , PLAYER_STATES.playing)
        Audioplayer.editField(guild, PLAYER_FIELDS.author, song.uploader.name)
        Audioplayer.editField(guild, PLAYER_FIELDS.duration, song.formattedDuration)
        Audioplayer.editField(guild, PLAYER_FIELDS.queue_duration, music_queue.formattedDuration)
        Audioplayer.editField(guild, PLAYER_FIELDS.remaining_songs, (music_queue.songs.length - 1).toString())
        await musicPlayerMap[guild].PlayerEmbed.setThumbnail(song.thumbnail).setTitle(song.name).setURL(song.url)
        await Audioplayer.pushChangesToPlayerMessage(guild,music_queue)
    })
    .on('addSong', async (music_queue, song) => {
        let guild = music_queue.textChannel.guildId;
        await music_queue.textChannel.send({content:
                `Добавлено: ${song.name} - \`${song.formattedDuration}\` в очередь по запросу \`${song.member.user.username}\``
        })
        Audioplayer.editField(guild, PLAYER_FIELDS.queue_duration, music_queue.formattedDuration)
        Audioplayer.editField(guild, PLAYER_FIELDS.remaining_songs, (music_queue.songs.length - 1).toString())
        await Audioplayer.pushChangesToPlayerMessage(music_queue.textChannel.guildId,music_queue)
    })
    .on('addList', async (music_queue, playlist) => {
        music_queue.textChannel.send({content:
                `Добавлено \`${playlist.songs.length}\` песен из плейлиста \`${playlist.name}\` в очередь по запросу \`${playlist.member.user.username}\``
        })
        let guild = music_queue.textChannel.guildId;
        Audioplayer.editField(guild, PLAYER_FIELDS.queue_duration, music_queue.formattedDuration)
        Audioplayer.editField(guild, PLAYER_FIELDS.remaining_songs, (music_queue.songs.length - 1).toString())
        await Audioplayer.pushChangesToPlayerMessage(music_queue.textChannel.guildId,music_queue)
    })
    .on("finishSong", async music_queue => {
        let guild = music_queue.textChannel.guildId;
        if (!music_queue.next) {
            await Audioplayer.setPlayerState(guild,PLAYER_STATES.waiting)
            if (!musicPlayerMap[guild]) {return}
            await Audioplayer.pushChangesToPlayerMessage(guild , music_queue)
        }
    })
    .on('disconnect', async music_queue => {
        let guildid = music_queue.textChannel.guildId
        await musicPlayerMap[guildid].Collector.stop()
        try{
            let channel = await music_queue.textChannel.fetch(musicPlayerMap[guildid].ChannelID);
            if (channel){
                await channel.messages.fetch(musicPlayerMap[guildid].MessageID).then((m) => {m.delete()});
            }
        }catch (e) {
            console.log("Ошибка при отключении"+e)
        }

        delete musicPlayerMap[guildid];
    })




function CheckAllNecessaryPermission(message,permissions_required){
    const bot = message.guild.members.cache.get(client.user.id)//client.users.fetch(client.user.id)
    const permission_provided = bot.permissions.has(permissions_required)
    if(!permission_provided) {
        if(bot.permissions.has(Permissions.FLAGS.SEND_MESSAGES)) {
            message.channel.send(`У БОТА недостаточно прав, напишите ${prefix}help (название команды), чтобы увидеть недостающие права. А также попросите администрацию сервера их выдать.`)
        }
    }
    return permission_provided
}

module.exports = { distube, lyricsFinder, client, prefix, CheckAllNecessaryPermission};

//ЛОГИН БОТА ДЕЛАТЬ ВСЕГДА В КОНЦЕ main.js
client.login(config.BOT_TOKEN);

//const ExpressServer = require('./web_application/ExpressServer.js')