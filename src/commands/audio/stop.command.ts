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
    name: "stop",
    description: 'Выключает проигрывание музыки',
    slash_builder: new SlashCommandBuilder()
        .setName("stop")
        .setDescription('Выключает проигрывание музыки.'),
    group: GroupAudio,
    guild_only: true,
    voice_required: true,
    voice_with_bot_only: true,
    bot_permissions: [
        PermissionsBitField.Flags.SendMessages,
    ],
    execute: async (interaction) => {
        await AudioCommandWrapperInteraction(interaction, async () => {
            await Audio.stop(interaction.guild!)
            await interaction.reply({content: generateMessageAudioPlayerStop(interaction.member as GuildMember)})
        })
    },
    executeText: async (message) => {
        await AudioCommandWrapperText(message, async () => {
            await Audio.stop(message.guild!)
            await message.reply({content: generateMessageAudioPlayerStop(message.member!)})
        })
    }
}

export function generateMessageAudioPlayerStop(member: GuildMember): string{
    return `${member} выключил плеер`
}
export default command
