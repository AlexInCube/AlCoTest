import {BotEvent} from "../Types";
import {Guild} from "discord.js";
import {setupSettings} from "../handlers/MongoSchemas/SchemaGuild";

const event: BotEvent = {
    name: "guildCreate",
    execute: async (guild: Guild) => {
        await setupSettings(guild)
    }
}

export default event;

