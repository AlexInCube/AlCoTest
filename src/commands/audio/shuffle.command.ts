import {ICommand} from "../../CommandTypes";
import {
    GuildMember,
    PermissionsBitField,
    SlashCommandBuilder,
} from "discord.js";
import {GroupAudio} from "./AudioTypes";
import {Audio} from "../../main";
import {AudioCommandWrapperInteraction, AudioCommandWrapperText} from "./util/AudioCommandWrappers";

const command : ICommand = {
    name: "shuffle",
    description: 'Перемешивает песни в очереди',
    slash_builder: new SlashCommandBuilder()
        .setName("shuffle")
        .setDescription('Перемешивает песни в очереди'),
    group: GroupAudio,
    guild_only: true,
    voice_required: true,
    voice_with_bot_only: true,
    bot_permissions: [
        PermissionsBitField.Flags.SendMessages,
    ],
    execute: async (interaction) => {
        await AudioCommandWrapperInteraction(interaction, async () => {
            if (await Audio.shuffle(interaction.guild!)){
                await interaction.reply({content: generateMessageAudioPlayerShuffle(interaction.member as GuildMember)})
            }else{
                await interaction.reply(generateMessageAudioPlayerShuffleFailure())
            }
        })
    },
    executeText: async (message) => {
        await AudioCommandWrapperText(message, async () => {
            if (await Audio.shuffle(message.guild!)){
                await message.reply({content: generateMessageAudioPlayerShuffle(message.member!)})
            }else{
                await message.reply(generateMessageAudioPlayerShuffleFailure())
            }
        })
    }
}

export function generateMessageAudioPlayerShuffle(member: GuildMember){
    return `${member} перемешал песни`
}

export function generateMessageAudioPlayerShuffleFailure(){
    return `Не удалось перемешать песни`
}
export default command
