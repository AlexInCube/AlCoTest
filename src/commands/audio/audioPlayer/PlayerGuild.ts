import {Client, Message, TextChannel} from "discord.js";
import {AudioPlayerEmbedBuilder} from "./AudioPlayerEmbedBuilder";
import {Queue} from "distube";
import {AudioPlayerButtonsHandler} from "./AudioPlayerButtonsHandler";
import {AudioPlayerState} from "./AudioPlayerTypes";

export class PlayerGuild{
    private readonly client: Client
    private readonly textChannel: TextChannel
    private state: AudioPlayerState = "loading"
    embedBuilder: AudioPlayerEmbedBuilder = new AudioPlayerEmbedBuilder()
    private buttonsHandler: AudioPlayerButtonsHandler
    private messageWithPlayer: Message | undefined
    private queue: Queue
    private updaterInterval: NodeJS.Timeout | undefined
    constructor(client: Client, txtChannel: TextChannel, queue: Queue) {
        this.client = client
        this.textChannel = txtChannel
        this.queue = queue
        this.buttonsHandler = new AudioPlayerButtonsHandler(this.client, this.textChannel)
    }

    private resetUpdater(){
        clearInterval(this.updaterInterval)
        //loggerSend("Interval Cleared")
        this.updaterInterval = setInterval(async () => {
            //loggerSend(`Interval Tick`)
            if (this.queue.songs[0]){
                //loggerSend(`Update: ${this.queue.currentTime}`)
                this.embedBuilder.setSongDuration(this.queue.currentTime, this.queue.songs[0].duration, this.queue.songs[0].isLive)
            }

            await this.update()
        }, 1370)
    }
    async init() {
        try{
            this.embedBuilder.update()

            if (!this.messageWithPlayer) {
                //loggerSend("Player Init")
                this.messageWithPlayer = await this.textChannel.send({embeds: [this.embedBuilder]})
                this.resetUpdater()
            } else {
                const messages = await this.textChannel.messages.fetch({ limit: 1 })
                const lastMessage = messages.first();

                if (lastMessage?.id !== this.messageWithPlayer.id){
                    if (await this.messageWithPlayer.delete()){
                        //loggerSend("Player Recreate")
                        this.messageWithPlayer = await this.textChannel.send({embeds: [this.embedBuilder]})
                        this.resetUpdater()
                    }
                }
            }
        } catch (e) { /* empty */ }
    }

    async update() {
        if (!this.messageWithPlayer) return
        if (!this.client.audioPlayer.distube.voices.has(this.messageWithPlayer.guild!)){
            //loggerSend("I am not in channel, so destroy")
            await this.destroy()
            return
        }

        try{
            await this.init()
            this.embedBuilder.setNextSong(this.queue.songs[1]?.name) //Temporary Shit
            this.embedBuilder.setQueueData(this.queue.songs.length, this.queue.duration)
            this.embedBuilder.update()

            // Add buttons if needed
            switch (this.state){
                case "playing":
                case "pause":
                    await this.messageWithPlayer.edit({embeds: [this.embedBuilder], components: this.buttonsHandler.getComponents()})
                    break
                case "waiting":
                case "loading":
                    await this.messageWithPlayer.edit({embeds: [this.embedBuilder], components: this.buttonsHandler.getComponentsOnlyStop()})
                    break
            }
        }catch (e) { /* empty */ }
    }
    async destroy() {
        //loggerSend("Player Destroy")
        clearInterval(this.updaterInterval)
        if (!this.messageWithPlayer) return
        try{
            this.buttonsHandler.destroy()
            await this.messageWithPlayer?.delete()
        }catch (e) { /* empty */ }
    }

    async setState(state: AudioPlayerState){
        this.state = state
        // When Distube is waiting the song, they remove their Queue object. So when we try to play a new song, we need to receive new Queue
        const queue = this.client.audioPlayer.distube.getQueue(this.textChannel.guild)
        if (queue){
            this.queue = queue
        }
        this.embedBuilder.setPlayerState(state)
    }

    debug(): string{
        return `Guild: ${this.textChannel.guildId}, Player State: ${this.state}, Message ID: ${this.messageWithPlayer?.id}\n`
    }
}
