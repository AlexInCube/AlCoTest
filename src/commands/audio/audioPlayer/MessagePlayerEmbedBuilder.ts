import {EmbedBuilder, User} from "discord.js";
import {AudioPlayerLoopMode, AudioPlayerState} from "./AudioPlayerTypes.js";
import {getNoun} from "../../../utilities/getNoun.js";
import {formatSecondsToTime} from "../../../utilities/formatSecondsToTime.js";
import i18next from "i18next";

export class MessagePlayerEmbedBuilder extends EmbedBuilder{
    private playerState: AudioPlayerState = "loading"
    private requester: User | undefined = undefined
    private uploader = i18next.t("audioplayer:player_embed_unknown")
    private songsCount = 0
    private queueDuration = "00:00"
    private loop = i18next.t("audioplayer:player_embed_loop_mode_off")
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
                this.addFields({name: i18next.t("audioplayer:player_embed_requester"), value: this.requester.toString(), inline: true})
            }
            this.setThumbnail(this.thumbnailURL)
            this.setTitle(this.title)
            this.setURL(this.titleUrl)
            this.addFields({name: i18next.t("audioplayer:player_embed_author"), value: `\`${this.uploader}\``, inline: true})
            this.addFields({name: i18next.t("audioplayer:player_embed_queue"), value: `
                \`${this.songsCount} ${getNoun(this.songsCount,
                    i18next.t("audioplayer:player_embed_queue_noun_one"),
                    i18next.t("audioplayer:player_embed_queue_noun_two"),
                    i18next.t("audioplayer:player_embed_queue_noun_five")
                )}\`
                 \`${this.queueDuration}\`
                 `, inline: true})
            this.addFields({name: i18next.t("audioplayer:player_embed_loop_mode"), value: `\`${this.loop}\``, inline: true})
            this.addFields({
                name: `${i18next.t("audioplayer:player_embed_song_length")}: `,
                value: `\`${this.formattedDuration}\``,
                inline: true
            })
            this.addFields({name: i18next.t("audioplayer:player_embed_next_song"), value: `\`${this.nextSong}\``, inline: false})
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
                this.setAuthor({name: `💿 ${i18next.t("audioplayer:player_embed_state_waiting")} 💿`}).setColor('#43f7f7').setURL(null).setTitle(null).setThumbnail(null)
                break
            case "pause":
                this.setAuthor({name: `⏸️ ${i18next.t("audioplayer:player_embed_state_pause")} ⏸️ `}).setColor('#f74343')
                break
            case "playing":
                this.setAuthor({name: `▶️ ${i18next.t("audioplayer:player_embed_state_playing")} ▶️`}).setColor('#49f743')
                break
            case "loading":
                this.setAuthor({name: `⌚ ${i18next.t("audioplayer:player_embed_state_loading")} ⌚`}).setColor('#f1f743').setURL(null).setTitle(null).setThumbnail(null)
                break
        }
    }

    setRequester(user: User){
        this.requester = user
    }

    setUploader(uploader: string | undefined){
        this.uploader = uploader ?? i18next.t("audioplayer:player_embed_unknown")
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
                this.loop = i18next.t("audioplayer:player_embed_loop_mode_off")
                break
            case "song":
                this.loop = i18next.t("audioplayer:player_embed_loop_mode_song")
                break
            case "queue":
                this.loop = i18next.t("audioplayer:player_embed_loop_mode_queue")
                break
        }
    }

    setNextSong(songName: string | undefined){
        if (songName === undefined){
            this.nextSong = i18next.t("audioplayer:player_embed_next_song_empty")
            return
        }
        this.nextSong = songName
    }

    setSongDuration(formattedDuration: number, isLive = false){
        if (isLive){
            this.formattedDuration = i18next.t("audioplayer:player_embed_duration_stream")
        }else{
            this.formattedDuration = formatSecondsToTime(formattedDuration)
        }
    }
}
