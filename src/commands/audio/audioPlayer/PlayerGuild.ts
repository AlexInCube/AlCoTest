import {Client, Message, TextChannel} from "discord.js";
import {AudioPlayerEmbedBuilder} from "./AudioPlayerEmbedBuilder";
import {Queue} from "distube";
import {AudioPlayerButtonsHandler} from "./AudioPlayerButtonsHandler";
import {AudioPlayerState} from "./AudioPlayerTypes";

export class PlayerGuild{
    private readonly client: Client
    textChannel: TextChannel
    state: AudioPlayerState = "loading"
    embedBuilder: AudioPlayerEmbedBuilder = new AudioPlayerEmbedBuilder()
    buttonsHandler: AudioPlayerButtonsHandler
    private messageWithPlayer: Message | undefined
    queue: Queue
    private readonly updaterInterval: NodeJS.Timeout
    constructor(client: Client, txtChannel: TextChannel, queue: Queue) {
        this.client = client
        this.textChannel = txtChannel
        this.queue = queue
        this.updaterInterval = setInterval(async () => {
            this.embedBuilder.setSongDuration(this.queue.currentTime, this.queue.songs[0].duration, this.queue.songs[0].isLive)
            await this.update()
        }, 1000)
        this.buttonsHandler = new AudioPlayerButtonsHandler(this.client, this.textChannel)
    }

    async init() {
        //loggerSend("Player Init")
        this.embedBuilder.update()
        this.messageWithPlayer = await this.textChannel.send({embeds: [this.embedBuilder]})
    }

    async update() {
        if (!this.messageWithPlayer) return
        if (!this.client.audioPlayer.distube.voices.has(this.messageWithPlayer.guild!)){
            //loggerSend("I am not in channel, so destroy")
            await this.destroy()
            return
        }

        try{
            // Recreate player if is not the last message in channel
            const messages = await this.textChannel.messages.fetch({ limit: 1 })
            const lastMessage = messages.first();
            if (this.queue.stopped) return

            if (lastMessage?.id !== this.messageWithPlayer.id){
                await this.messageWithPlayer.delete()
                await this.init()
                return
            }

            this.embedBuilder.setNextSong(this.queue.songs[1]?.name) //Temporary Shit
            this.embedBuilder.update()

            // Add buttons if needed
            if (this.state == "playing" || this.state == "pause"){
                await this.messageWithPlayer.edit({embeds: [this.embedBuilder], components: this.buttonsHandler.getComponents()})
            }else{
                await this.messageWithPlayer.edit({embeds: [this.embedBuilder], components: this.buttonsHandler.getComponentsOnlyStop()})
            }
        }catch (e) {
            //loggerSend("try to recovery player")
            try {
                const msg = await this.messageWithPlayer.channel.messages.fetch(this.messageWithPlayer.id)
                if (!msg) {
                    await this.init()
                }
            }catch (e) {
                await this.init()
            }
        }
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
        this.embedBuilder.setPlayerState(state)
    }
}
