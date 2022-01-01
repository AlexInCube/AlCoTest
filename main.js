const Discord = require("discord.js");
const config = require("./config.json");
const prefix = config.BOT_PREFIX;
const fs = require('fs') // подключаем fs к файлу
const {getCurrentTimestamp} = require("./tools");

const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_VOICE_STATES"] });
client.commands = new Discord.Collection() // создаём коллекцию для команд


//Находим имена команд (имя файла.js) и собираем их в коллекцию.
fs.readdir('./commands', (err, files) => { // чтение файлов в папке commands
    if (err) console.log(getCurrentTimestamp()+err)

    let jsfile = files.filter(f => f.split('.').pop() === 'js') // файлы не имеющие расширение .js игнорируются
    if (jsfile.length <= 0) return console.log(getCurrentTimestamp()+'Команды не найдены!') // если нет ни одного файла с расширением .js

    console.log(getCurrentTimestamp()+`Загружено ${jsfile.length} команд`)
    jsfile.forEach((f, i) => { // добавляем каждый файл в коллекцию команд
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

    if (args === undefined) {args = []};

    let command_file = client.commands.get(command) // получение команды из коллекции
    if (command_file) command_file.run(client, message, args)
});

global.musicPlayerMap = {}
const DisTube = require("distube")
const { SpotifyPlugin } = require("@distube/spotify");

const distube = new DisTube.default(client,{
    plugins: [new SpotifyPlugin()],
})


distube
    .on('playSong', async (music_queue, song) => {
        let guild = music_queue.textChannel.guildId;
        musicPlayerMap[guild].PlayerEmbed.setTitle(song.name).setAuthor(`🎵 Играет 🎵`).setColor('#49f743').setThumbnail(song.thumbnail);
        musicPlayerMap[guild].PlayerEmbed.fields[0].value = song.uploader.name
        musicPlayerMap[guild].PlayerEmbed.fields[1].value = song.formattedDuration
        let channel = await music_queue.textChannel.fetch(musicPlayerMap[guild].ChannelID);
        let message = await channel.messages.fetch(musicPlayerMap[guild].MessageID);
        await message.edit({embeds: [musicPlayerMap[guild].PlayerEmbed]});
    })
    .on('addSong', (music_queue, song) =>
        music_queue.textChannel.send({content: `Добавлено: ${song.name} - \`${song.formattedDuration}\` в очередь по запросу ${song.user}`}))


module.exports = { distube };

client.login(config.BOT_TOKEN);