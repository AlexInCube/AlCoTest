import {BotEvent} from "../Types.js";
import {Client, Events, Message, TextChannel} from "discord.js";
import {textCommandsHandler} from "./messageHandlers/textCommandsHandler.js";
import {playerMessageHandler} from "./messageHandlers/playerMessageHandler.js";

const event: BotEvent = {
    name: Events.MessageCreate,
    execute: async function (client: Client, message: Message) {
        await textCommandsHandler(client, message)

        if (!message.guild) return
        await playerMessageHandler(message.channel as TextChannel)
    }
}

export default event
