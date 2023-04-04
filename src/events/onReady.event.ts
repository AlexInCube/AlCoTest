import {BotEvent} from "../Types";
import {loggerSend} from "../utilities/logger";
import {Events} from "discord.js";

const event: BotEvent = {
    name: Events.ClientReady,
    once: true,
    execute: (client) => {
        if (!client.user) return

        loggerSend(`Бот ${client.user.username} запустился, версия ${process.env.npm_package_version}`)
        client.user.setActivity('Напиши /help')
    }
}

export default event