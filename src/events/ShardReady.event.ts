import {BotEvent} from "../Types";
import {loggerSend} from "../utilities/logger";
import {Events} from "discord.js";
import {loggerPrefixDJSWS} from "./ShardError.event";

const event: BotEvent = {
    name: Events.ShardReady,
    execute: () => {
        loggerSend(loggerPrefixDJSWS + `Подключение прошло успешно`)
    }
}

export default event