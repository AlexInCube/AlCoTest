import {TextChannel} from "discord.js";
import {client} from "../../main";

export async function playerMessageHandler(textChannel: TextChannel){
    try{
        //loggerSend("playerMessageHandler")
        const player = client.audioPlayer.playersManager.get(textChannel.guild.id)
        if (player) {
            if (player.textChannel.id !== textChannel.id) return
            await player.recreatePlayer()
        }
    }catch (e) { /* empty */ }
}
