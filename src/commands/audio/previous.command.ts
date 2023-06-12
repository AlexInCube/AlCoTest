import {ICommand} from "../../CommandTypes.js";
import {
    GuildMember,
    PermissionsBitField,
    SlashCommandBuilder,
} from "discord.js";
import {GroupAudio} from "./AudioTypes.js";
import {AudioCommandWrapperInteraction, AudioCommandWrapperText} from "./util/AudioCommandWrappers.js";
import {Song} from "distube";
import i18next from "i18next";

export default function(): ICommand {
    return {
        text_data: {
            name: "previous",
            description: i18next.t("commands:previous_desc"),
            execute: async (message) => {
                await AudioCommandWrapperText(message, async () => {
                    const song = await message.client.audioPlayer.previous(message.guild!)
                    if (song) {
                        await message.reply({content: generateMessageAudioPlayerPrevious(message.member as GuildMember, song)})
                    }else{
                        await message.reply({content: generateMessageAudioPlayerPreviousFailure()})
                    }
                })
            }
        },
        slash_data: {
            slash_builder: new SlashCommandBuilder()
                .setName("previous")
                .setDescription(i18next.t("commands:previous_desc")),
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
        },
        guild_data: {
            guild_only: true,
            voice_required: true,
            voice_with_bot_only: true,
        },
        group: GroupAudio,
        bot_permissions: [
            PermissionsBitField.Flags.SendMessages,
        ],
    }
}

export function generateMessageAudioPlayerPrevious(member: GuildMember, song: Song){
    return `:rewind: ${member} ${i18next.t("previous_success")} ${song.name} :rewind:`
}

export function generateMessageAudioPlayerPreviousFailure(){
    return i18next.t("previous_error_song_not_exists")
}

