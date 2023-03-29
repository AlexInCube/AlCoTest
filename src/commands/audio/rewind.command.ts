import {CommandArgument, ICommand} from "../../CommandTypes";
import {
    PermissionsBitField,
    SlashCommandBuilder,
} from "discord.js";
import {GroupAudio} from "./AudioTypes";
import {Audio} from "../../main";
import {AudioCommandWrapperInteraction, AudioCommandWrapperText} from "./util/AudioCommandWrappers";
import {generateErrorEmbed} from "../../utilities/generateErrorEmbed";

const command : ICommand = {
    name: "rewind",
    description: 'Перематывает песню на указанное время',
    arguments: [new CommandArgument("время в секундах", true)],
    slash_builder: new SlashCommandBuilder()
        .setName("rewind")
        .setDescription('Перематывает песню на указанное время')
        .addNumberOption(option =>
            option
                .setName('time')
                .setDescription('Секунды')
                .setNameLocalizations({
                    ru: 'секунды'
                })
                .setRequired(true)
        ),
    group: GroupAudio,
    guild_only: true,
    voice_required: true,
    voice_with_bot_only: true,
    bot_permissions: [
        PermissionsBitField.Flags.SendMessages,
    ],
    execute: async (interaction) => {
        const time = interaction.options.getNumber('time')

        await AudioCommandWrapperInteraction(interaction, async () => {
            await Audio.rewind(interaction.guild!, time!)
            await interaction.reply({content: `Песня перемотана на ${time}`})
        })
    },
    executeText: async (message, args) => {
        let time = 0
        try{
            time = parseInt(args[0])
        }catch (e) {
            await message.reply({embeds: [generateErrorEmbed("Это не число, а белеберда")]})
            return
        }

        await AudioCommandWrapperText(message, async () => {
            await Audio.rewind(message.guild!, time!)
            await message.reply({content: `Песня перемотана на ${time}`})
        })
    }
}
export default command
