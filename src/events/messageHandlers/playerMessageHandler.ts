import {TextChannel} from "discord.js";

export async function playerMessageHandler(textChannel: TextChannel){
    try{
        const player = textChannel.client.audioPlayer.playersManager.get(textChannel.guild.id)
        if (player) {
            if (player.textChannel.id !== textChannel.id) return
            await player.recreatePlayer()
        }
    }catch (e) { /* empty */ }
}
