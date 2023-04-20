import {BotEvent} from "../Types";
import {loggerSend} from "../utilities/logger";
import {Events} from "discord.js";
import {loggerPrefixDJSWS} from "./ShardError.event";

const event: BotEvent = {
    name: Events.ShardResume,
    execute: async () => {
        loggerSend(loggerPrefixDJSWS + `Переподключение успешно`)
        // setTimeout(async () => {
        //     await Audio.playersManager.stopAll()
        // }, 2000)
    }
}

export default event
