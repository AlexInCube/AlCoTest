import {BotEvent} from "../Types";
import {Guild} from "discord.js";
import {setupSettings} from "../handlers/MongoSchemas/SchemaGuild";
import {Events} from "discord.js";

const event: BotEvent = {
    name: Events.GuildDelete,
    execute: async (guild: Guild) => {
        await setupSettings(guild)
    }
}

export default event;

