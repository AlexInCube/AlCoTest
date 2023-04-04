import {CommandArgument, ICommand} from "../../CommandTypes";
import {
    GuildMember,
    PermissionsBitField,
    SlashCommandBuilder,
} from "discord.js";
import {GroupAudio} from "./AudioTypes";
import {Audio} from "../../main";
import {AudioCommandWrapperInteraction, AudioCommandWrapperText} from "./util/AudioCommandWrappers";
import {generateErrorEmbed} from "../../utilities/generateErrorEmbed";
import {getNoun} from "../../utilities/getNoun";

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
        const time = interaction.options.getNumber('time')!

        await AudioCommandWrapperInteraction(interaction, async () => {
            if (await Audio.rewind(interaction.guild!, time)){
                await interaction.reply({content: generateMessageAudioPlayerRewind(interaction.member as GuildMember, time)})
            }else{
                await interaction.reply({content: generateMessageAudioPlayerRewindFailure(), ephemeral: true})
            }
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
            if (await Audio.rewind(message.guild!, time)) {
                await message.reply({content: generateMessageAudioPlayerRewind(message.member!, time)})
            }else{
                await message.reply({content: generateMessageAudioPlayerRewindFailure()})
            }
        })
    }
}

export function generateMessageAudioPlayerRewind(member: GuildMember, time: number){
    return `${member} перемотал песню на ${time} ${getNoun(time, "секунду", "секунды", "секунд")}`
}

export function generateMessageAudioPlayerRewindFailure(){
    return `Перемотка не удалась`
}
export default command