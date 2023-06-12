import {GuildMember, VoiceChannel} from "discord.js";
import {checkBotInVoice} from "./checkBotInVoice.js";
import i18next from "i18next";

export async function checkMemberInVoiceWithBot(member: GuildMember): Promise<{ errorMessage: string; channelTheSame: boolean }> {
    const response = {
        channelTheSame: false,
        errorMessage: "CheckingVoiceError"
    }
    const connection = checkBotInVoice(member.guild)
    if (connection) {
        if (member.voice.channel) {
            response.channelTheSame = connection.joinConfig.channelId === member.voice?.channel.id
            if (response.channelTheSame){
                return response
            }
        }else{
            response.errorMessage = i18next.t("commandshandlers:voice_join_in_any_channel")
            return response
        }

        await member.guild.client.channels.fetch(connection.joinConfig.channelId!).then(channel => {
            if (channel) {
                if (channel instanceof VoiceChannel) {
                    response.errorMessage = `${i18next.t("commandshandlers:voice_join_in_channel")} ${channel.name}`
                }
            }
        })
    }

    return response
}
