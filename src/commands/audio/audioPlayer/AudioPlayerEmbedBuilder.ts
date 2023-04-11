import {EmbedBuilder, User} from "discord.js";
import {AudioPlayerLoopMode, AudioPlayerState} from "./AudioPlayerTypes";
import {getNoun} from "../../../utilities/getNoun";
import {formatSecondsToTime} from "../../../utilities/formatSecondsToTime";

export class AudioPlayerEmbedBuilder extends EmbedBuilder{
    private playerState: AudioPlayerState = "loading"
    private requester: User | undefined = undefined
    private uploader = "Неизвестно"
    private songsCount = 0
    private queueDuration = "00:00"
    private loop = "Выключено"
    private nextSong = ""
    private title: string | null = null
    private titleUrl: string | null = null
    private thumbnailURL: string | null = null
    private formattedDuration = "00:00"

    constructor() {
        super();
        this.setPlayerState("loading")
        this.setNextSong(undefined)
    }

    update() {
        this.setFields([]) // Reset all fields
        this.setThumbnail(null)
        if (this.playerState !== "waiting" && this.playerState !== "loading"){
            if (this.requester){
                this.addFields({name: "Запросил", value: this.requester.toString(), inline: true})
            }
            this.setThumbnail(this.thumbnailURL)
            this.setTitle(this.title)
            this.setURL(this.titleUrl)
            this.addFields({name: "Автор", value: `\`${this.uploader}\``, inline: true})
            this.addFields({name: "Очередь", value: `
                \`${this.songsCount} ${getNoun(this.songsCount, "песня", "песни", "песен")}\`
                 \`${this.queueDuration}\`
                 `, inline: true})
            this.addFields({name: "Режим повтора", value: `\`${this.loop}\``, inline: true})
            this.addFields({
                name: "Длительность песни: ",
                value: `\`${this.formattedDuration}\``,
                inline: true
            })
            this.addFields({name: "Следующая песня", value: `\`${this.nextSong}\``, inline: false})
        }

        return this
    }

    setSongTitle(name: string, url: string){
        this.title = name
        this.titleUrl = url
    }

    setPlayerState(state: AudioPlayerState){
        this.playerState = state

        //loggerSend(state)

        switch (this.playerState){
            case "waiting":
                this.setAuthor({name: '💿 Жду следующую песню 💿'}).setColor('#43f7f7').setURL(null).setTitle(null).setThumbnail(null)
                break
            case "pause":
                this.setAuthor({name: '⏸️ Пауза ⏸️ '}).setColor('#f74343')
                break
            case "playing":
                this.setAuthor({name: '▶️ Играет ▶️'}).setColor('#49f743')
                break
            case "loading":
                this.setAuthor({name: '⌚ Пожалуйста, подождите... ⌚'}).setColor('#f1f743').setURL(null).setTitle(null).setThumbnail(null)
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

    setThumbnailURL(url: string | null) {
        this.thumbnailURL = url
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

    setSongDuration(formattedDuration: number, isLive = false){
        if (isLive){
            this.formattedDuration = "Прямая трансляция"
        }else{
            this.formattedDuration = formatSecondsToTime(formattedDuration)
        }
    }
}
