import {CommandArgument, ICommand} from "../../CommandTypes.js";
import {
    GuildMember,
    PermissionsBitField,
    SlashCommandBuilder,
} from "discord.js";
import {GroupAudio} from "./AudioTypes.js";
import {AudioCommandWrapperInteraction, AudioCommandWrapperText} from "./util/AudioCommandWrappers.js";
import {formatSecondsToTime} from "../../utilities/formatSecondsToTime.js";

const command : ICommand = {
    name: "rewind",
    description: 'Перематывает песню на указанное время в формате ЧЧ:ММ:CC или ММ:СС или СС',
    arguments: [new CommandArgument("время в формате ЧЧ:ММ:CC", true)],
    slash_builder: new SlashCommandBuilder()
        .setName("rewind")
        .setDescription('Перематывает песню на указанное время в формате ЧЧ:ММ:CC или ММ:СС или СС')
        .addStringOption(option =>
            option
                .setName('time')
                .setDescription('ЧЧ:ММ:CC или ММ:СС или СС')
                .setNameLocalizations({
                    ru: 'время'
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
        const time = hmsToSeconds(interaction.options.getString('time')!)

        await AudioCommandWrapperInteraction(interaction, async () => {
            if (time){
                if (await interaction.client.audioPlayer.rewind(interaction.guild!, time)){
                    await interaction.reply({content: generateMessageAudioPlayerRewind(interaction.member as GuildMember, time)})
                }
            } else {
                await interaction.reply({content: generateMessageAudioPlayerRewindFailure(), ephemeral: true})
            }
        })
    },
    executeText: async (message, args) => {
        const time = hmsToSeconds(args[0])

        await AudioCommandWrapperText(message, async () => {
            if (time){
                if (await message.client.audioPlayer.rewind(message.guild!, time)) {
                    await message.reply({content: generateMessageAudioPlayerRewind(message.member!, time)})
                }
            } else {
                await message.reply({content: generateMessageAudioPlayerRewindFailure()})
            }
        })
    }
}

function hmsToSeconds(str: string): number | undefined{
    const p = str.split(':')
    let s = 0
    let m = 1

    if (p.length > 3) return undefined

    try{
        while (p.length > 0) {
            s += m * parseInt(p.pop() as string, 10);
            m *= 60;
        }
    } catch (e) {
        return undefined
    }

    if (s < 0) s = 0

    return s;
}

export function generateMessageAudioPlayerRewind(member: GuildMember, time: number){
    return `${member} перемотал песню на ${formatSecondsToTime(time)}`
}

export function generateMessageAudioPlayerRewindFailure(){
    return `Ты неправильно написал время, что мне делать с этой белибердой?`
}
export default command
