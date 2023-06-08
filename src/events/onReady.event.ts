import {BotEvent} from "../Types.js";
import {loggerSend} from "../utilities/logger.js";
import {Events} from "discord.js";
import i18next from "i18next";

const event: BotEvent = {
    name: Events.ClientReady,
    once: true,
    execute: (client) => {
        if (!client.user) return

        loggerSend(i18next.t("bot_is_running", {botName: client.user.username, version: process.env.npm_package_version}))
        client.user.setActivity('Send /help')
    }
}

export default event
