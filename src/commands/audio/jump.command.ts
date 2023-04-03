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
import {Song} from "distube";

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
            const song = await Audio.jump(interaction.guild!, pos!)
            if (song){
                await interaction.reply(generateMessageAudioPlayerJump(interaction.member as GuildMember, song))
            }else{
                await interaction.reply(generateMessageAudioPlayerJumpFailure())
            }
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
            const song = await Audio.jump(message.guild!, pos!)
            if (song){
                await message.reply(generateMessageAudioPlayerJump(message.member!, song))
            }else{
                await message.reply(generateMessageAudioPlayerJumpFailure())
            }
        })
    }
}

function generateMessageAudioPlayerJump(member: GuildMember, song: Song){
    return `:fast_forward: ${member} перескочил на песню ${song.name} :fast_forward:`
}

function generateMessageAudioPlayerJumpFailure(){
    return `Прыжок не удался`
}
export default command
