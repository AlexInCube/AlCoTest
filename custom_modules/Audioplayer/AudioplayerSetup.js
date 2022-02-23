const DisTubeLib = require("distube");
const config = require("config");
const {SpotifyPlugin} = require("@distube/spotify");
const {YtDlpPlugin} = require("@distube/yt-dlp");
const {SoundCloudPlugin} = require("@distube/soundcloud");
const Audioplayer = require("./Audioplayer");
const {PLAYER_FIELDS , PLAYER_STATES} = require("./Audioplayer");

module.exports.PlayerInitSetup = (client) => {
    global.musicPlayerMap = {}

    const distube = new DisTubeLib.default(client,{
        searchSongs: 0,
        leaveOnEmpty: true,
        emptyCooldown: 30,
        leaveOnFinish: true,
        leaveOnStop: true,
        youtubeDL: false,
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
                }),
            new YtDlpPlugin(),
            new SoundCloudPlugin()
        ],
    })

    distube
        .on('error', async (textChannel , e) => {
            if (e.errorCode === "UNAVAILABLE_VIDEO") {
                await textChannel.send("Это видео недоступно из-за жестокости")
                if (distube.getQueue(textChannel.guild)) {
                    await distube.skip(textChannel.guild)
                }
                return
            }
            console.error(e)
            textChannel.send(`Произошла ошибка: ${e.stack}`.slice(0 , 2000))
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
            await Audioplayer.stopPlayer(distube,music_queue.textChannel.guild)
        })

    return distube
}