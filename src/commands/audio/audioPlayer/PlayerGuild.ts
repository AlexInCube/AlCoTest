import {Client, Message, TextChannel} from "discord.js";
import {AudioPlayerEmbedBuilder} from "./AudioPlayerEmbedBuilder";
import {Queue} from "distube";
import {AudioPlayerButtonsHandler} from "./AudioPlayerButtonsHandler";
import {AudioPlayerState} from "./AudioPlayerTypes";
import {loggerSend} from "../../../utilities/logger";
import {checkBotInVoice} from "../../../utilities/checkBotInVoice";


export class PlayerGuild{
    private finishTime = 20000
    private updateTime = 3500
    private readonly client: Client
    readonly textChannel: TextChannel
    private state: AudioPlayerState = "loading"
    embedBuilder: AudioPlayerEmbedBuilder = new AudioPlayerEmbedBuilder()
    private buttonsHandler: AudioPlayerButtonsHandler
    private messageWithPlayer: Message | undefined
    lastDeletedMessage: Message | undefined
    private queue: Queue
    private updaterInterval: NodeJS.Timeout | undefined // Timer for update state of the message
    private recreationTimer: NodeJS.Timeout | undefined // Timer for "recreationPlayer"
    private finishTimer: NodeJS.Timeout | undefined // Timer for waiting
    constructor(client: Client, txtChannel: TextChannel, queue: Queue) {
        this.client = client
        this.textChannel = txtChannel
        this.queue = queue
        this.buttonsHandler = new AudioPlayerButtonsHandler(this.client, this.textChannel)
    }

    async startFinishTimer() {
        try{
            if (await checkBotInVoice(this.textChannel.guild)) {
                await this.stopFinishTimer()
                this.finishTimer = setTimeout(async () => {
                    const queue = this.client.audioPlayer.distube.getQueue(this.textChannel.guild)
                    // loggerSend('try to stop player on cooldown')
                    if (queue) return
                    if (await checkBotInVoice(this.textChannel.guild)) {
                        await this.client.audioPlayer.stop(this.textChannel.guild)
                        await this.textChannel.send("Время прошло, никто не смог дать мне новую песню. Я ухожу от вас.")
                    }
                }, this.finishTime)
            }
        }catch (e) { /* empty */ }
    }

    async stopFinishTimer(){
        if (this.finishTimer){
            clearTimeout(this.finishTimer)
        }
    }
    private resetUpdater(){
        clearInterval(this.updaterInterval)
        //loggerSend("Interval Cleared")
        this.updaterInterval = setInterval(async () => {
            this.updateEmbedState()

            await this.update()
        }, this.updateTime)
    }

    private updateEmbedState(){
        const queue = this.client.audioPlayer.distube.getQueue(this.textChannel.guild)
        if (queue) {
            this.queue = queue
        }
        this.embedBuilder.setPlayerState(this.state)

        const currentSong = this.queue.songs[0]
        if (currentSong){
            this.embedBuilder.setSongDuration(this.queue.currentTime, currentSong.duration, currentSong.isLive)
            this.embedBuilder.setSongTitle(currentSong.name ?? "Неизвестно", currentSong.url)
            this.embedBuilder.setThumbnailURL(currentSong.thumbnail ?? null)
            this.embedBuilder.setUploader(currentSong.uploader.name)

            if (currentSong.user) {
                this.embedBuilder.setRequester(currentSong.user)
            }
        }
        this.embedBuilder.setNextSong(this.queue.songs[1]?.name)
        this.embedBuilder.setQueueData(this.queue.songs.length, this.queue.duration)

        this.embedBuilder.update()
    }

    private async updateMessageState() {
        if (!this.messageWithPlayer) return
        switch (this.state) {
            case "playing":
            case "pause":
                await this.messageWithPlayer.edit({
                    embeds: [this.embedBuilder],
                    components: this.buttonsHandler.getComponents()
                })
                break
            case "waiting":
            case "loading":
                await this.messageWithPlayer.edit({
                    embeds: [this.embedBuilder],
                    components: this.buttonsHandler.getComponentsOnlyStop()
                })
                break
        }
    }
    async init() {
        try{
            this.updateEmbedState()

            if (!this.messageWithPlayer) {
                //loggerSend("Player Init")
                this.messageWithPlayer = await this.textChannel.send({embeds: [this.embedBuilder]})
                this.resetUpdater()
            } else {
                await this.recreatePlayer()
            }
        } catch (e) { loggerSend(e) }
    }

    async recreatePlayer(){
        if (!this.messageWithPlayer) return
        if (this.recreationTimer){
            clearTimeout(this.recreationTimer)
        }
        this.recreationTimer = setTimeout(async () => {
            if (!this.messageWithPlayer) return
            const messages = await this.textChannel.messages.fetch({limit: 1})
            const lastMessage = messages.first();

            if (lastMessage?.id !== this.messageWithPlayer.id) {
                try {
                    this.lastDeletedMessage = this.messageWithPlayer
                    await this.messageWithPlayer.delete()
                } finally {
                    this.messageWithPlayer = await this.textChannel.send({embeds: [this.embedBuilder]})
                    this.resetUpdater()
                    await this.updateMessageState()
                }
            }
        }, this.updateTime)
    }

    async update() {
        if (!this.messageWithPlayer) return
        if (this.state === "destroying") return
        if (!this.client.audioPlayer.distube.voices.has(this.messageWithPlayer.guild!)){
            //loggerSend("I am not in channel, so destroy")
            await this.destroy()
            return
        }

        try{
            this.updateEmbedState()
            await this.updateMessageState()
        }catch (e) { /* empty */ }
    }
    async destroy() {
        //loggerSend("Player Destroy")
        await this.setState("destroying")
        clearInterval(this.updaterInterval)
        if (this.recreationTimer) clearTimeout(this.recreationTimer)
        await this.stopFinishTimer()
        if (!this.messageWithPlayer) return
        try{
            this.buttonsHandler.destroy()
            this.lastDeletedMessage = this.messageWithPlayer
            await this.messageWithPlayer?.delete()
        }catch (e) { /* empty */ }
    }

    async setState(state: AudioPlayerState) {
        this.state = state
        // When Distube is waiting the song, they remove their Queue object. So when we try to play a new song, we need to receive new Queue
        const queue = this.client.audioPlayer.distube.getQueue(this.textChannel.guild)
        if (queue) {
            this.queue = queue
        }

        if (state === "waiting"){
            await this.startFinishTimer()
        } else {
            if (this.finishTimer && queue){
                clearTimeout(this.finishTimer)
            }
        }

        await this.update()
    }

    debug(): string{
        return `GuildName: ${this.textChannel.guild.name}, Player State: ${this.state}, GuildID: ${this.textChannel.guildId},  VoiceChannelID: ${this.queue.voice.channel.id}, VoiceChannelName: ${this.queue.voice.channel.name}, TextChannelId: ${this.textChannel.id}, TextChannelName: ${this.textChannel.name} Message ID: ${this.messageWithPlayer?.id}\n`
    }
}
