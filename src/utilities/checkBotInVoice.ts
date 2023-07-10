import {Guild} from "discord.js";
import {getVoiceConnection, VoiceConnection} from "@discordjs/voice";

export function checkBotInVoice(guild: Guild): VoiceConnection | undefined{
    //return getVoiceConnection(guild.id, guild.client.user?.id) ?? getVoiceConnection(guild.id)
    return getVoiceConnection(guild.id)
}
