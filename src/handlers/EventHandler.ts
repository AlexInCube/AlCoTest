import { Client } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { BotEvent } from "../Types";
import {loggerSend} from "../utilities/logger";

module.exports = (client: Client) => {
    const eventsDir: string = join(__dirname, "../events")
    let eventsCount = 0

    readdirSync(eventsDir).forEach(file => {
        if (!file.endsWith(".js")) return;
        const event: BotEvent = require(`${eventsDir}/${file}`).default

        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args))
        }else{
            client.on(event.name, (...args) => event.execute(...args))
        }

        eventsCount++
    })

    loggerSend(`Загружено событий: ${eventsCount}`)
}
