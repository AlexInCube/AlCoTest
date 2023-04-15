import {BotEvent} from "../Types";
import {loggerSend} from "../utilities/logger";
import {Events} from "discord.js";
import {loggerPrefixDJSWS} from "./ShardError.event";

const event: BotEvent = {
    name: Events.ShardReconnecting,
    once: true,
    execute: () => {
        loggerSend(loggerPrefixDJSWS + `Попытка переподключения`)
    }
}

export default event