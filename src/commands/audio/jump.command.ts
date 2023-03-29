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
    name: "jump",
    description: 'Прыжок сразу к нужной песни из очереди',
    arguments: [new CommandArgument("позиция в очереди", true)],
    slash_builder: new SlashCommandBuilder()
        .setName("jump")
        .setDescription('Прыжок сразу к нужной песни из очереди')
        .addNumberOption(option =>
            option
                .setName('position')
                .setDescription('Номер песни из очереди')
                .setNameLocalizations({
                    ru: 'номер'
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
        const pos = interaction.options.getNumber('position')! - 1

        if (pos < 1){
            return
        }
        
        await AudioCommandWrapperInteraction(interaction, async () => {
            await Audio.jump(interaction.guild!, pos)
            await interaction.reply({content: "Прыжок совершён"})
        })
    },
    executeText: async (message, args) => {
        let pos = 0
        try{
            pos = parseInt(args[0]) - 1
            if (pos < 1){
                return
            }
        }catch (e) {
            await message.reply({embeds: [generateErrorEmbed("Это не число, а белеберда")]})
            return
        }

        await AudioCommandWrapperText(message, async () => {
            await Audio.jump(message.guild!, pos!)
            await message.reply({content: "Прыжок совершён"})
        })
    }
}
export default command
