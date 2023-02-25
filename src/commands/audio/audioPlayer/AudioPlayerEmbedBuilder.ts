import {EmbedBuilder, User} from "discord.js";
import {AudioPlayerLoopMode, AudioPlayerState} from "./AudioPlayerTypes";
import {getNoun} from "../../../utilities/getNoun";
import progressBar from "string-progressbar"
import {formatSecondsToTime} from "../../../utilities/formatSecondsToTime";

export class AudioPlayerEmbedBuilder {
    private playerState: AudioPlayerState = "loading"
    private requester: User | undefined = undefined
    private uploader = "Неизвестно"
    private songsCount = 0
    private queueDuration = "00:00"
    private loop = "Выключено"
    private nextSong = ""

    private currentDuration = 0
    private formattedCurrentDuration = "00:00"
    private maxDuration = 0
    private formattedMaxDuration = "00:00"
    private duration_bar = ""

    private readonly embed: EmbedBuilder = new EmbedBuilder();

    constructor() {
        this.setPlayerState("loading")
        this.setSongDuration(1, 1, false)
        this.setNextSong(undefined)
    }

    getEmbed() {
        this.embed.setFields([]) // Reset all fields
        if (this.playerState != "waiting" && this.playerState != "loading"){
            if (this.requester){
                this.embed.addFields({name: "Запросил", value: this.requester.toString(), inline: true})
            }

            this.embed.addFields({name: "Автор", value: `\`${this.uploader}\``, inline: true})
            this.embed.addFields({name: "Очередь", value: `
                \`${this.songsCount} ${getNoun(this.songsCount, "песня", "песни", "песен")}\`
                 \`${this.queueDuration}\`
                 `, inline: true})
            this.embed.addFields({name: "Режим повтора", value: `\`${this.loop}\``, inline: true})
            this.embed.addFields({name: "Следующая песня", value: `\`${this.nextSong}\``, inline: true})
            this.embed.addFields({
                name: "Длительность: ",
                value: `${this.duration_bar}
                    \`[${this.formattedCurrentDuration} / ${this.formattedMaxDuration}]\``,
                inline: false
            })
        }

        return this.embed
    }

    setSongTitle(name: string, url: string){
        this.embed.setTitle(name)
        this.embed.setURL(url)
    }

    setThumbnail(url: string){
        this.embed.setThumbnail(url)
    }
    setPlayerState(state: AudioPlayerState){
        this.playerState = state

        switch (this.playerState){
            case "waiting":
                this.embed.setAuthor({name: '💿 Ожидание 💿'}).setColor('#43f7f7').setURL(null).setTitle(null).setThumbnail(null)
                break
            case "pause":
                this.embed.setAuthor({name: '⏸️ Пауза ⏸️ '}).setColor('#f74343')
                break
            case "playing":
                this.embed.setAuthor({name: '▶️ Играет ▶️'}).setColor('#49f743')
                break
            case "loading":
                this.embed.setAuthor({name: '⌚ Пожалуйста, подождите... ⌚'}).setColor('#f1f743').setURL(null).setTitle(null).setThumbnail(null)
                break
        }
    }

    setRequester(user: User){
        this.requester = user
    }

    setUploader(uploader: string | undefined){
        this.uploader = uploader ?? "Неизвестно"
    }

    setQueueData(songs_count: number, queue_duration: number){
        this.songsCount = songs_count
        this.queueDuration = formatSecondsToTime(queue_duration)
    }

    setLoopMode(mode: AudioPlayerLoopMode){
        switch (mode){
            case "disabled":
                this.loop = "Выключено"
                break
            case "song":
                this.loop = "Песня"
                break
            case "queue":
                this.loop = "Очередь"
                break
        }
    }

    setNextSong(songName: string | undefined){
        if (songName === undefined){
            this.nextSong = "Пусто"
            return
        }
        this.nextSong = songName
    }

    setSongDuration(currentSeconds: number, maxSeconds: number = this.maxDuration, isLive = false){
        this.currentDuration = currentSeconds
        this.maxDuration = maxSeconds
        this.formattedCurrentDuration = formatSecondsToTime(currentSeconds)
        if (isLive){
            this.formattedMaxDuration = "Прямая трансляция"
            this.duration_bar = `|${progressBar.splitBar(1, 1, 1, undefined, '🔷')[0]}|`
        }else{
            this.formattedMaxDuration = formatSecondsToTime(maxSeconds)
            this.duration_bar = `|${progressBar.splitBar(maxSeconds, currentSeconds, 26, undefined, '🔷')[0]}|`
        }
    }
}