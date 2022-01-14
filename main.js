const Discord = require("discord.js");
const config = require("./config.json");
const prefix = config.BOT_PREFIX;
const fs = require('fs') // подключаем fs к файлу
const {getCurrentTimestamp} = require("./tools");

const mysql = require("mysql2");

const connection = mysql.createConnection({
    host: config.DB_IP,
    user: config.DB_USER,
    database: config.DB_DATABASE,
    password: config.DB_PASSWORD
});
connection.connect(function(err){
    if (err) {
        return console.error(getCurrentTimestamp()+"Ошибка: " + err.message);
    }
    else{
        console.log(getCurrentTimestamp()+"Подключение к серверу MySQL успешно установлено");
    }

    let sql_query = "CREATE TABLE IF NOT EXISTS guild_settings (guild_id INT NOT NULL, settings TEXT NOT NULL)"

    connection.query(sql_query, function (err) {
        if (err) throw err;
        console.log(getCurrentTimestamp()+"Таблица настроек создана");
    });
});

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
    client.user.setActivity('Хозяин снова взялся за меня');
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
    if (command_file) command_file.run(client, message, args)
    else message.reply("Команды не существует")
});

//Музыкальный блок
global.musicPlayerMap = {}
const DisTubeLib = require("distube")
const { SpotifyPlugin } = require("@distube/spotify");
const lyricsFinder = require('lyrics-finder');

const distube = new DisTubeLib.default(client,{
    searchSongs: 1,
    searchCooldown: 30,
    plugins: [new SpotifyPlugin()],
})


distube
    .on('error', (textChannel, e) => {
        console.error(e)
        textChannel.send(`Произошла ошибка, сообщите об этом криворукому разрабу: ${e.stack}`.slice(0, 2000))
    })
    .on('playSong', async (music_queue, song) => {
        let guild = music_queue.textChannel.guildId;
        await musicPlayerMap[guild].PlayerEmbed.setTitle(song.name).setURL(song.url).setAuthor({name: `🎵 Играет 🎵`}).setColor('#49f743').setThumbnail(song.thumbnail);
        musicPlayerMap[guild].PlayerEmbed.fields[0].value = song.uploader.name || "Неизвестно"//Автор загрузки
        musicPlayerMap[guild].PlayerEmbed.fields[1].value = song.formattedDuration || "Неизвестно"//Длительность песни
        musicPlayerMap[guild].PlayerEmbed.fields[2].value = music_queue.formattedDuration || "Неизвестно"//Длительность очереди
        musicPlayerMap[guild].PlayerEmbed.fields[3].value = (music_queue.songs.length - 1).toString() || "Неизвестно"//Количество песен в очереди
        await updateMusicPlayerMessage(guild,music_queue)
    })
    .on('addSong', async (music_queue, song) => {
        let guild = music_queue.textChannel.guildId;
        await music_queue.textChannel.send({content: `Добавлено: ${song.name} - \`${song.formattedDuration}\` в очередь по запросу ${song.user}`})
        musicPlayerMap[guild].PlayerEmbed.fields[2].value = music_queue.formattedDuration || "Неизвестно"//Длительность очереди
        musicPlayerMap[guild].PlayerEmbed.fields[3].value = (music_queue.songs.length - 1).toString() || "Неизвестно"//Количество песен в очереди
        await updateMusicPlayerMessage(music_queue.textChannel.guildId,music_queue)
    })
    .on('addList', async (music_queue, playlist) => {
        await music_queue.textChannel.send(
            `Добавлено \`${playlist.songs.length}\` песен из плейлиста \`${playlist.name}\` в очередь по запросу ${playlist.user}`
        )
        let guild = music_queue.textChannel.guildId;
        musicPlayerMap[guild].PlayerEmbed.fields[2].value = music_queue.formattedDuration || "Неизвестно"//Длительность очереди
        musicPlayerMap[guild].PlayerEmbed.fields[3].value = (music_queue.songs.length - 1).toString() || "Неизвестно"//Количество песен в очереди
        await updateMusicPlayerMessage(music_queue.textChannel.guildId,music_queue)
    })
    .on('disconnect', queue => {delete musicPlayerMap[queue.textChannel.guildId]})

module.exports = { distube, lyricsFinder, client };

//ЛОГИН БОТА ДЕЛАТЬ ВСЕГДА В КОНЦЕ main.js
client.login(config.BOT_TOKEN);

async function updateMusicPlayerMessage(guildid,music_queue) {
    try {
        let channel = await music_queue.textChannel.fetch(musicPlayerMap[guildid].ChannelID);
        let message = await channel.messages.fetch(musicPlayerMap[guildid].MessageID);
        await message.edit({embeds: [musicPlayerMap[guildid].PlayerEmbed]});
    } catch (e) {
        console.log(getCurrentTimestamp()+"Ошибка с обновлением полей: " + e)
        //delete musicPlayerMap[guild]
    }
}