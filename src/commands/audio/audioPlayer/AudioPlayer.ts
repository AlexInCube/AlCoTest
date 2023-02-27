import {Client, EmbedBuilder, TextChannel, VoiceBasedChannel} from "discord.js";
import {DisTube, PlayOptions, SearchResult, Song} from 'distube';
import {PlayersManager} from "./PlayersManager";
import {loggerSend} from "../../../utilities/logger";
import SpotifyPlugin from "@distube/spotify";
import {YtDlpPlugin} from "@distube/yt-dlp";
import SoundCloudPlugin from "@distube/soundcloud";

export class AudioPlayer{
    client: Client
    playersManager: PlayersManager
    distube: DisTube
    constructor(_client: Client) {
        this.client = _client
        this.playersManager = new PlayersManager(this.client)
        this.distube = new DisTube(this.client, {
            leaveOnEmpty: true,
            emptyCooldown: process.env.NODE_ENV === 'production' ? 20 : 5,
            leaveOnFinish: false,
            leaveOnStop: true,
            youtubeCookie: process.env.BOT_YOUTUBE_COOKIE,
            nsfw: true,
            emitAddListWhenCreatingQueue: false,
            emitAddSongWhenCreatingQueue: false,
            plugins: [
                new YtDlpPlugin({
                    update: true
                }),
                new SpotifyPlugin(
                    {
                        parallel: true,
                        emitEventsAfterFetching: true,
                        api: {
                            clientId: process.env.BOT_SPOTIFY_CLIENT_ID,
                            clientSecret: process.env.BOT_SPOTIFY_CLIENT_SECRET
                        }
                    }),
                new SoundCloudPlugin()
            ]
        })
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.client.distube = this.distube

        this.setupEvents()
    }

    async play(voiceChannel: VoiceBasedChannel, textChannel: TextChannel, song: string | Song | SearchResult, options?: PlayOptions) {
        await this.distube.voices.join(voiceChannel)
        await this.distube.play(voiceChannel, song, options)
    }

    setupEvents(){
        this.distube
            .on("empty", async (queue) => {
                loggerSend("Distube Empty")
                await queue.textChannel?.send('Все ушли от меня, значит я тоже ухожу.')
                await this.playersManager.remove(queue.id)
            })
            .on("initQueue", async (queue) => {
                await this.playersManager.add(queue.id, queue.textChannel as TextChannel, queue)

                const player = this.playersManager.get(queue.id)
                if (player) {
                    await player.init()
                }
            })
            .on("playSong", async (queue, song) => {
                const player = this.playersManager.get(queue.id)
                if (player) {
                    player.embedBuilder.setPlayerState("playing")
                    player.embedBuilder.setSongTitle(song.name ?? "Неизвестно", song.url)
                    player.embedBuilder.setQueueData(queue.songs.length, queue.duration)
                    if (song.thumbnail) {
                        player.embedBuilder.setThumbnail(song.thumbnail)
                    }
                    if (song.member) {
                        player.embedBuilder.setRequester(song.user!)
                    }
                    if (queue.songs.length > 1){
                        player.embedBuilder.setNextSong(queue.songs[1].name)
                    }
                    player.embedBuilder.setUploader(song.uploader.name)
                    player.embedBuilder.setSongDuration(0, song.duration, song.isLive)
                }
            })
            .on("disconnect", async (queue) => {
                loggerSend("Distube Disconnect")
                await this.playersManager.remove(queue.id)
            })
            .on("addSong", async (queue, song) => {
                const songEmbed = new EmbedBuilder()
                    .setTitle(song.name ?? null)
                    .setURL(song.url)
                    .setAuthor({ name: `🎵${song.member!.user.username} добавил песню🎵` })
                    .setDescription(`Длительность - ${song.formattedDuration} | Автор - ${song.uploader.name}`)
                    .setThumbnail(song.thumbnail ?? null)

                const player = this.playersManager.get(queue.id)
                if (player){
                    player.embedBuilder.setQueueData(queue.songs.length, queue.duration)
                }

                if (queue.textChannel){
                    await queue.textChannel.send({ embeds: [songEmbed] })
                }
            })
            .on("addList", async (queue, playlist) => {
                const songEmbed = new EmbedBuilder()
                    .setTitle(playlist.name ?? null)
                    .setURL(playlist.url ?? null)
                    .setAuthor({ name: `🎵${playlist.member!.user.username} добавил песню🎵` })
                    .setDescription(`Количество песен - ${playlist.songs.length} | Длительность - ${playlist.formattedDuration}`)
                    .setThumbnail(playlist.thumbnail ?? null)

                const player = this.playersManager.get(queue.id)
                if (player){
                    player.embedBuilder.setQueueData(queue.songs.length, queue.duration)
                }

                if (queue.textChannel){
                    await queue.textChannel.send({ embeds: [songEmbed] })
                }
            })
            .on('finishSong', async (queue) => {
                if (!this.playersManager.has(queue.id)) return
                if (queue.songs.length > 1 && queue.stopped) return
                this.playersManager.get(queue.id)?.embedBuilder.setPlayerState("waiting")
            })
            .on("error", async (channel, error) => {
                loggerSend("Distube Error")

                channel?.send(`Произошла ошибка: ${error}`.slice(0, 2000))
            })
    }
}
