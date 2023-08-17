import {BotEvent} from "../Types.js";
import {loggerSend} from "../utilities/logger.js";
import {Events} from "discord.js";

const event: BotEvent = {
    name: Events.ClientReady,
    once: true,
    execute: (client) => {
        if (!client.user) return

        loggerSend(`Bot ${client.user.username} is running, on version ${process.env.npm_package_version}`)
        client.user.setActivity('/help')
    }
}

export default event
