import {BotEvent} from "../Types";
import {Events, Message, TextChannel} from "discord.js";
import {textCommandsHandler} from "./messageHandlers/textCommandsHandler";
import {playerMessageHandler} from "./messageHandlers/playerMessageHandler";

const event: BotEvent = {
    name: Events.MessageCreate,
    execute: async function (message: Message) {
        await textCommandsHandler(message)

        if (!message.guild) return
        await playerMessageHandler(message.channel as TextChannel)
    }
}

export default event
