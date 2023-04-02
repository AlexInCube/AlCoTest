import {BotEvent} from "../Types";
import {Events, Message, TextChannel} from "discord.js";
import {client} from "../main";

const event: BotEvent = {
    name: Events.MessageDelete,
    execute: async (message: Message) => {
        if (message.guild) return

        const textChannel = message.channel as TextChannel
        const player = client.audioPlayer.playersManager.get(textChannel.guild.id)
        if (player) {
            if (player.textChannel.id !== textChannel.id) return
            if (player.lastDeletedMessage?.id === message.id) return
            await player.recreatePlayer()
        }
    }
}

export default event
