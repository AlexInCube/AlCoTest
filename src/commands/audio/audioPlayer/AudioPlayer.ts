import {Client, TextChannel, VoiceBasedChannel} from "discord.js";
import {DisTube, PlayOptions, SearchResult, Song} from 'distube';
import {PlayersManager} from "./PlayersManager";
import {loggerSend} from "../../../utilities/logger";

export class AudioPlayer{
    client: Client
    playersManager: PlayersManager
    distube: DisTube
    constructor(_client: Client) {
        this.client = _client
        this.playersManager = new PlayersManager(this.client)
        this.distube = new DisTube(this.client, {
            searchSongs: 5,
            searchCooldown: 30,
            leaveOnEmpty: false,
            leaveOnFinish: false,
            leaveOnStop: false,
        })

        this.setupEvents()
    }

    async play(
        voiceChannel: VoiceBasedChannel,
        textChannel: TextChannel,
        song: string | Song | SearchResult,
        options?: PlayOptions) {
        await this.distube.play(voiceChannel, song, options)
    }

    setupEvents(){
        this.distube
            .on("initQueue", async (queue) => {
                await this.playersManager.add(queue.textChannel!.guildId, queue.textChannel as TextChannel, queue)
                await this.playersManager.get(queue.textChannel!.guildId)?.init()
            })
            .on("playSong", async (queue, song) => {
                const player = this.playersManager.get(queue.id)
                if (player) {
                    player.embedBuilder.setPlayerState("playing")
                    player.embedBuilder.setSongTitle(song.name ?? "Неизвестно", song.url)
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
            .on("error", async (channel, error) => {
                loggerSend("Distube Error")

                channel?.send(`Произошла ошибка: ${error}`.slice(0, 2000))
            })
    }
}
