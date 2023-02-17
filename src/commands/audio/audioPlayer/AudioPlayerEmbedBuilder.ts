import {EmbedBuilder, User} from "discord.js";
import {AudioPlayerLoopMode, AudioPlayerState} from "./AudioPlayerTypes";
import {getNoun} from "../../../utilities/getNoun";

export class AudioPlayerEmbedBuilder {
    private playerState: AudioPlayerState = "waiting"
    private requester: User | undefined = undefined
    private uploader = "Неизвестно"
    private queue: {songs_count: number, formatted_duration: string} = {songs_count: 0, formatted_duration: "00:00"}
    private loop: AudioPlayerLoopMode = "disabled"
    private next_song = "Неизвестно"
    private duration = "00:00"
    private readonly embed: EmbedBuilder = new EmbedBuilder();

    constructor() {
        this.setPlayerState("waiting")
    }

    getEmbed() {
        this.embed.setFields([]) // Reset all fields
        if (this.playerState != "waiting"){
            if (this.requester){
                this.embed.addFields({name: "Запросил", value: this.requester.toString(), inline: true})
            }

            this.embed.addFields({name: "Автор", value: `\`${this.uploader}\``, inline: true})
            this.embed.addFields({name: "Очередь", value: `
                \`${this.queue.songs_count} ${getNoun(this.queue.songs_count, "песня", "песни", "песен")}\`
                 \`${this.queue.formatted_duration}\`
                 `, inline: true})
            this.embed.addFields({name: "Режим повтора", value: this.loop, inline: true})
            this.embed.addFields({name: "Следующая песня", value: this.next_song, inline: true})
            this.embed.addFields({name: "Длительность: ", value: this.duration, inline: false})
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
        }
    }

    setRequester(user: User){
        this.requester = user
    }
}