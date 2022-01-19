const ytdl = require('ytdl-core')
const fs = require("fs");
const {Permissions} = require("discord.js");
const {distube} = require("../main");
const {getData} = require('spotify-url-info')

module.exports.help = {
    name: "extract_audio",
    bot_permissions: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.MANAGE_MESSAGES]
};

module.exports.run = async (client,message,args) => {
    let url = args[0]
    let file_path = fs.createWriteStream('audio.mp3')
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
        await fs.rename('audio.mp3',file_name,(err => {if(err)throw err}))
        await bot_message.edit({content: `${message.author} я смог извлечь звук`, files: [file_name]})
        fs.unlink(file_name,(err => {if(err)throw err}))
    }).pipe(file_path)
};
