import {Client, Collection, Message, TextChannel} from "discord.js";
import {AudioPlayerState} from "./AudioPlayerTypes";
import {AudioPlayerEmbedBuilder} from "./AudioPlayerEmbedBuilder";
import {loggerSend} from "../../../utilities/logger";
import {Queue} from "distube";

export class PlayerGuild{
    private client: Client
    state: AudioPlayerState = "waiting"
    textChannel: TextChannel
    embedBuilder: AudioPlayerEmbedBuilder = new AudioPlayerEmbedBuilder()
    private messageWithPlayer: Message | undefined

    queue: Queue
    private readonly updaterInterval: NodeJS.Timeout

    constructor(_client: Client, txtChannel: TextChannel, _queue: Queue) {
        this.client = _client
        this.textChannel = txtChannel
        this.queue = _queue
        this.updaterInterval = setInterval(async () => {
            this.embedBuilder.setSongDuration(this.queue.currentTime)
            await this.update()
        }, 1000)
    }

    async init() {
        loggerSend("Player Init")
        this.messageWithPlayer = await this.textChannel.send({embeds: [this.embedBuilder.getEmbed()]})
    }

    async update() {
        if (!this.messageWithPlayer) return
        await this.messageWithPlayer.edit({embeds: [this.embedBuilder.getEmbed()]})
    }
    async destroy() {
        clearInterval(this.updaterInterval)
        await this.messageWithPlayer?.delete()
    }
}
export class PlayersManager{
    private readonly client: Client;
    private readonly collection = new Collection<string, PlayerGuild>();
    constructor(_client: Client) {
        this.client = _client
    }
    async add(guildId: string, textChannel: TextChannel, queue: Queue): Promise<PlayerGuild | undefined> {
        if (await this.client.guilds.cache.get(guildId)) {
            if (!this.collection.has(guildId)) {
                loggerSend("Player Added")
                this.collection.set(guildId, new PlayerGuild(this.client, textChannel, queue))
            }

            return this.collection.get(guildId)
        }

        return undefined
    }

    get(guildId: string): PlayerGuild | undefined{
        return this.collection.get(guildId)
    }

    async remove(guildId: string) {
        const player = this.get(guildId)
        if (player) {
            await player.destroy()
            this.collection.delete(guildId)
        }
    }

    has(guildId: string): boolean{
        return this.collection.has(guildId)
    }
}
