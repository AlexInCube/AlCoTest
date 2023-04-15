import {BotEvent} from "../Types";
import {loggerSend} from "../utilities/logger";
import {Events} from "discord.js";

export const loggerPrefixDJSWS = "[ Discord.js / Websocket ] "

const event: BotEvent = {
    name: Events.ShardError,
    once: true,
    execute: (error) => {
        loggerSend(loggerPrefixDJSWS + `Произошла ошибка: ${error}`)
    }
}

export default event