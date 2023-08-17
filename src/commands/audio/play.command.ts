import {CommandArgument, ICommand} from "../../CommandTypes.js";
import {
    AutocompleteInteraction,
    GuildMember, Message,
    PermissionsBitField,
    SlashCommandBuilder,
    TextChannel,
    VoiceChannel
} from "discord.js";
import {GroupAudio} from "./AudioTypes.js";
import {isValidURL} from "../../utilities/isValidURL.js";
import {SearchResultType, SearchResultVideo} from "distube";
import {truncateString} from "../../utilities/truncateString.js";
import i18next from "i18next";

export const services = "Youtube, Spotify, Soundcloud, Yandex Music, HTTP-stream"
export default function(): ICommand {
    return {
        text_data: {
            name: "play",
            description: i18next.t("commands:play_desc"),
            arguments: [new CommandArgument(i18next.t('commands:play_arg_link', {services: services}), true)],
            execute: async (message: Message, args: string[]) => {
                const songQuery = args.join(" ")

                const member = message.member as GuildMember
                await message.client.audioPlayer.play(member.voice.channel as VoiceChannel, message.channel as TextChannel, songQuery, {
                    member: message.member as GuildMember,
                    textChannel:  message.channel as TextChannel
                })

                await message.delete()
            }
        },
        slash_data: {
            slash_builder: new SlashCommandBuilder()
                .setName("play")
                .setDescription(i18next.t("commands:play_desc"))
                .addStringOption(option =>
                    option
                        .setName('request')
                        .setDescription(i18next.t('commands:play_arg_link', {services: services}))
                        .setAutocomplete(true)
                        .setRequired(true)),
            autocomplete: songSearchAutocomplete,
            execute: async (interaction, ) => {
                const songQuery = interaction.options.getString('request')

                await interaction.reply({
                    content: i18next.t("general:thinking") as string,
                });
                await interaction.deleteReply();

                const member = interaction.member as GuildMember
                if (songQuery) {
                    await interaction.client.audioPlayer.play(member.voice.channel as VoiceChannel, interaction.channel as TextChannel, songQuery, {
                        member: interaction.member as GuildMember,
                        textChannel:  interaction.channel as TextChannel
                    })
                }
            },
        },
        group: GroupAudio,
        guild_data: {
            guild_only: true,
            voice_required: true
        },
        bot_permissions: [
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.Connect,
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.Speak,
            PermissionsBitField.Flags.ManageMessages,
            PermissionsBitField.Flags.AttachFiles,
        ],
    }
}

export async function songSearchAutocomplete(interaction: AutocompleteInteraction) {
    const focusedValue = interaction.options.getFocused(false)

    if (focusedValue && !isValidURL(focusedValue)) {
        const choices = await interaction.client.audioPlayer.distube.search(focusedValue, {
            limit: 10,
            type: SearchResultType.VIDEO,
            safeSearch: false
        })

        const finalResult = choices.map((choice: SearchResultVideo) => {
            const duration = choice.isLive ? i18next.t("commands:play_stream") : choice.formattedDuration
            let choiceString = `${duration} | ${truncateString(choice.uploader.name ?? "", 20)} | `
            choiceString += truncateString(choice.name, 100 - choiceString.length)
            return {
                name: choiceString,
                value: choice.url
            }
        })

        await interaction.respond(finalResult)
        return
    }

    await interaction.respond([])
}

