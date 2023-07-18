import {BotEvent} from "../Types.js";
import {Client, Events, Message, TextChannel} from "discord.js";

const event: BotEvent = {
    name: Events.MessageDelete,
    execute: async (client: Client, message: Message) => {
        if (!message.guild) return

        const textChannel = message.channel as TextChannel
        const player = client.audioPlayer.playersManager.get(textChannel.guild.id)
        if (player) {
            if (player.textChannel.id !== textChannel.id) return
            if (player.lastDeletedMessage?.id === message.id) return // If player deleted message them self, then don`t "trigger" event
            try{
                await player.recreatePlayer()
            }catch (e) { /* empty */ }
        }
    }
}

export default event
