import {Client, Collection, Message, TextChannel} from "discord.js";
import {loggerSend} from "../../../utilities/logger";
import {Queue} from "distube";
import {PlayerGuild} from "./PlayerGuild";

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
