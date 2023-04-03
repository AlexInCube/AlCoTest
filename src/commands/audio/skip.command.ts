import {ICommand} from "../../CommandTypes";
import {
    PermissionsBitField,
    SlashCommandBuilder,
} from "discord.js";
import {GroupAudio} from "./AudioTypes";
import {Audio} from "../../main";
import {AudioCommandWrapperInteraction, AudioCommandWrapperText} from "./util/AudioCommandWrappers";
import {Song} from "distube";

const command : ICommand = {
    name: "skip",
    description: 'Пропустить текущую песню',
    slash_builder: new SlashCommandBuilder()
        .setName("skip")
        .setDescription('Пропустить текущую песню'),
    group: GroupAudio,
    guild_only: true,
    voice_required: true,
    voice_with_bot_only: true,
    bot_permissions: [
        PermissionsBitField.Flags.SendMessages,
    ],
    execute: async (interaction) => {
        await AudioCommandWrapperInteraction(interaction, async () => {
            const song = await Audio.skip(interaction.guild!)
            if (song){
                await interaction.reply({content: generateSkipMessage(song)})
            }else{
                await interaction.reply({content: generateSkipMessageFailure(), ephemeral: true})
            }
        })
    },
    executeText: async (message) => {
        await AudioCommandWrapperText(message, async () => {
            const song = await Audio.skip(message.guild!)
            if (song){
                await message.reply({content: generateSkipMessage(song)})
            }else{
                await message.reply({content: generateSkipMessageFailure()})
            }
        })
    }
}

export function generateSkipMessage(song: Song): string{
    return `:fast_forward: ${song.member} пропустил(-а) песню ${song.name} - ${song.uploader.name} :fast_forward:`
}

export function generateSkipMessageFailure(): string{
    return `Дальше в очереди ничего нет, пропуск невозможен`
}
export default command
