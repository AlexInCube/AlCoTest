import {GuildMember} from "discord.js";

export function checkMemberInVoice(member: GuildMember){
    const voice = member.voice.channel
    return voice !== null
}