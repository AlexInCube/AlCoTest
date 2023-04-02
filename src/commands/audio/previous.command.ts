import {ICommand} from "../../CommandTypes";
import {
    PermissionsBitField,
    SlashCommandBuilder,
} from "discord.js";
import {GroupAudio} from "./AudioTypes";
import {Audio} from "../../main";
import {AudioCommandWrapperInteraction, AudioCommandWrapperText} from "./util/AudioCommandWrappers";

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
            await Audio.previous(interaction.guild!)
        })
    },
    executeText: async (message) => {
        await AudioCommandWrapperText(message, async () => {
            await Audio.previous(message.guild!)
        })
    }
}
export default command
