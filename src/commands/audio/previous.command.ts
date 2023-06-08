import {ICommand} from "../../CommandTypes.js";
import {
    GuildMember,
    PermissionsBitField,
    SlashCommandBuilder,
} from "discord.js";
import {GroupAudio} from "./AudioTypes.js";
import {AudioCommandWrapperInteraction, AudioCommandWrapperText} from "./util/AudioCommandWrappers.js";
import {Song} from "distube";

const command : ICommand = {
    name: "previous",
    description: 'Переключение на предыдущую проигрываемую песню',
    slash_builder: new SlashCommandBuilder()
        .setName("previous")
        .setDescription('Переключение на предыдущую проигрываемую песню'),
    group: GroupAudio,
    guild_only: true,
    voice_required: true,
    voice_with_bot_only: true,
    bot_permissions: [
        PermissionsBitField.Flags.SendMessages,
    ],
    execute: async (interaction) => {
        await AudioCommandWrapperInteraction(interaction, async () => {
            const song = await interaction.client.audioPlayer.previous(interaction.guild!)
            if (song) {
                await interaction.reply({content: generateMessageAudioPlayerPrevious(interaction.member as GuildMember, song)})
            }else{
                await interaction.reply({content: generateMessageAudioPlayerPreviousFailure(), ephemeral: true})
            }
        })
    },
    executeText: async (message) => {
        await AudioCommandWrapperText(message, async () => {
            const song = await message.client.audioPlayer.previous(message.guild!)
            if (song) {
                await message.reply({content: generateMessageAudioPlayerPrevious(message.member as GuildMember, song)})
            }else{
                await message.reply({content: generateMessageAudioPlayerPreviousFailure()})
            }
        })
    }
}

export function generateMessageAudioPlayerPrevious(member: GuildMember, song: Song){
    return `:rewind: ${member} вернулся на предыдущую песню ${song.name} :rewind:`
}

export function generateMessageAudioPlayerPreviousFailure(){
    return "Предыдущих песен не существует"
}
export default command
