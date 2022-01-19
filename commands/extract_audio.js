const ytdl = require('ytdl-core')
const fs = require("fs");
const {Permissions} = require("discord.js");
const {distube} = require("../main");
const {getData} = require('spotify-url-info')
const {generateRandomCharacters} = require("../tools");

module.exports.help = {
    name: "extract_audio",
    arguments: "Ссылка на Youtube видел или Spotify трек (в любом случае поиск будет на Youtube)",
    description: "Достаёт аудио дорожку из видео и отправляет её в чат",
    bot_permissions: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.MANAGE_MESSAGES]
};

module.exports.run = async (client,message,args) => {
    let url = args[0]
    let file_path = fs.createWriteStream(`${generateRandomCharacters(15)}.mp3`)
    let song_data;
    let search_query;

    let bot_message = await message.channel.send({content: `${message.author} ожидайте...`})

    if (url.startsWith("https://open.spotify.com")){
        await getData(url).then(data => {
            search_query = data.name
        })
    }else{
        search_query = url
    }

    try {
        song_data = await distube.search(search_query, {limit: 1, type: 'video'}).then(function (result) {
            return result[0]
        });
    } catch (e) {
        await bot_message.edit({content: `${message.author} я не смог ничего найти`})
        return
    }

    let file_name = `${song_data.name}.mp3`
    ytdl(song_data.url,{filter: 'audioonly', format: 'mp3'}).on("end", async () => {
        await fs.rename(file_path.path,file_name,(err => {if(err)throw err}))
        let stats = fs.statSync(file_name)
        if (stats.size >= 8388608){
            await bot_message.edit({content: `${message.author} я не могу отправить файл, так как он весит больше чем 8мб.`})
        }else{
            await bot_message.edit({content: `${message.author} я смог извлечь звук`, files: [file_name]})
        }

        fs.unlink(file_name,(err => {if(err)throw err}))
    }).pipe(file_path)
};
