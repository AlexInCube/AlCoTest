import {GuildMember, VoiceChannel} from "discord.js";
import {checkBotInVoice} from "./checkBotInVoice";

export async function checkMemberInVoiceWithBot(member: GuildMember): Promise<{ errorMessage: string; channelTheSame: boolean }> {
    const response = {
        channelTheSame: false,
        errorMessage: "Ошибка"
    }
    const connection = checkBotInVoice(member.guild)
    if (connection) { // Проверяем, подключён ли бот хоть к какому-нибудь голосовому каналу
        if (member.voice.channel) {
            response.channelTheSame = connection.joinConfig.channelId === member.voice?.channel.id
            if (response.channelTheSame){
                return response
            }
        }else{
            response.errorMessage = "Зайди в любой голосовой канал"
            return response
        }

        await member.guild.client.channels.fetch(connection.joinConfig.channelId!).then(channel => {
            if (channel) {
                if (channel instanceof VoiceChannel) {
                    response.errorMessage = `Зайди в голосовой канал ${channel.name}`
                }
            }
        })
    }

    return response
}
