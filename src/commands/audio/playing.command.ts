import {ICommand} from "../../CommandTypes";
import {
    EmbedBuilder,
    Guild,
    PermissionsBitField,
    SlashCommandBuilder,
} from "discord.js";
import {GroupAudio} from "./AudioTypes";
import {Audio} from "../../main";
import {AudioCommandWrapperInteraction, AudioCommandWrapperText} from "./util/AudioCommandWrappers";
import {splitBar} from "../../utilities/splitBar";
import {Queue} from "distube";

const command : ICommand = {
    name: "playing",
    description: 'Показывает текущее время проигрывания песни',
    slash_builder: new SlashCommandBuilder()
        .setName("playing")
        .setDescription('Показывает текущее время проигрывания песни'),
    group: GroupAudio,
    guild_only: true,
    voice_required: true,
    voice_with_bot_only: true,
    bot_permissions: [
        PermissionsBitField.Flags.SendMessages,
    ],
    execute: async (interaction) => {
        await AudioCommandWrapperInteraction(interaction, async () => {
            await interaction.reply({embeds: [generatePlayingMessage(interaction.guild!)], ephemeral: true})
        })
    },
    executeText: async (message) => {
        await AudioCommandWrapperText(message, async () => {
            await message.reply({embeds: [generatePlayingMessage(message.guild!)]})
        })
    }
}

export function generatePlayingMessage(guild: Guild): EmbedBuilder{
    const queue = Audio.distube.getQueue(guild)
    const embed = new EmbedBuilder()
        .setColor('#4F51FF')

    if (queue){
        const song = queue.songs[0]
        embed.setTitle(song.name!)
        embed.setURL(song.url)
        embed.setAuthor({name: "Сейчас играет:"})
        embed.addFields({name: "Длительность:", value: generateTimeline(queue), inline: true})
    }else{
        embed.setColor("#FF0022")
        embed.setTitle("В плеере сейчас ничего не проигрывается")
    }

    return embed
}

export function generateTimeline(queue: Queue): string{
    const song = queue.songs[0]
    let durationValue: string

    if (song.isLive){
        durationValue = `\`Прямая трансляция [${queue.formattedCurrentTime}]\``
    }else{
        durationValue = `|${splitBar(song.duration, Math.max(queue.currentTime, 1), 25, undefined, '🔷')[0]}|\n\`[${queue.formattedCurrentTime}/${song.formattedDuration}]\``
    }

    return durationValue
}

export default command
