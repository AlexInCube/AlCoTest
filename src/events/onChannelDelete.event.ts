import {BotEvent} from "../Types";
import {Events, TextChannel} from "discord.js";
import {client} from "../main";

const event: BotEvent = {
    name: Events.ChannelDelete,
    execute: async (channel: TextChannel) => {
        const player = client.audioPlayer.playersManager.get(channel.guild.id)
        if (player?.textChannel.id === channel.id) {
            await client.audioPlayer.stop(channel.guild)
        }
    }
}

export default event