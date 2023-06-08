import {ICommand} from "../../CommandTypes.js";
import {
    GuildMember,
    PermissionsBitField,
    SlashCommandBuilder,
} from "discord.js";
import {GroupAudio} from "./AudioTypes.js";
import {AudioCommandWrapperInteraction, AudioCommandWrapperText} from "./util/AudioCommandWrappers.js";

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
            if (await interaction.client.audioPlayer.shuffle(interaction.guild!)){
                await interaction.reply({content: generateMessageAudioPlayerShuffle(interaction.member as GuildMember)})
            }else{
                await interaction.reply(generateMessageAudioPlayerShuffleFailure())
            }
        })
    },
    executeText: async (message) => {
        await AudioCommandWrapperText(message, async () => {
            if (await message.client.audioPlayer.shuffle(message.guild!)){
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
