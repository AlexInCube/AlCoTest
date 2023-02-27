import {Client, Message, TextChannel} from "discord.js";
import {AudioPlayerState} from "./AudioPlayerTypes";
import {AudioPlayerEmbedBuilder} from "./AudioPlayerEmbedBuilder";
import {DisTube, Queue} from "distube";
import {loggerSend} from "../../../utilities/logger";

export class PlayerGuild{
    private client: Client
    state: AudioPlayerState = "waiting"
    textChannel: TextChannel
    embedBuilder: AudioPlayerEmbedBuilder = new AudioPlayerEmbedBuilder()
    private messageWithPlayer: Message | undefined

    queue: Queue
    private readonly updaterInterval: NodeJS.Timeout

    constructor(client: Client, txtChannel: TextChannel, queue: Queue) {
        this.client = client
        this.textChannel = txtChannel
        this.queue = queue
        this.updaterInterval = setInterval(async () => {
            this.embedBuilder.setSongDuration(this.queue.currentTime)
            await this.update()
        }, 1000)
    }

    async init() {
        loggerSend("Player Init")
        this.embedBuilder.update()
        this.messageWithPlayer = await this.textChannel.send({embeds: [this.embedBuilder]})
    }
    async update() {
        if (!this.messageWithPlayer) return
        if (!this.client.distube.voices.get(this.messageWithPlayer.guild!)){
            loggerSend("I am not in channel, so destroy")
            await this.destroy()
            return
        }

        try{
            this.embedBuilder.update()
            await this.messageWithPlayer.edit({embeds: [this.embedBuilder]})
        }catch (e) {
            loggerSend("try to recovery player")
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
        loggerSend("Player Destroy")
        clearInterval(this.updaterInterval)
        if (!this.messageWithPlayer) return
        try{
            await this.messageWithPlayer?.delete()
        }catch (e) { /* empty */ }
    }
}