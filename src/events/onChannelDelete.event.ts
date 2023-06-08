import {BotEvent} from "../Types.js";
import {Client, Events, TextChannel} from "discord.js";

const event: BotEvent = {
    name: Events.ChannelDelete,
    execute: async (client: Client, channel: TextChannel) => {
        const player = client.audioPlayer.playersManager.get(channel.guild.id)
        if (player?.textChannel.id === channel.id) {
            await client.audioPlayer.stop(channel.guild)
        }
    }
}

export default event
