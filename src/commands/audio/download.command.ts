import {CommandArgument, ICommand} from "../../CommandTypes.js";
import {
    EmbedBuilder,
    PermissionsBitField,
    SlashCommandBuilder,
} from "discord.js";
import {GroupAudio} from "./AudioTypes.js";
import {services} from "./play.command.js";
import {getDownloadLink} from "./audioPlayer/getDownloadLink.js";
import i18next from "i18next";
import {generateErrorEmbed} from "../../utilities/generateErrorEmbed.js";

export default function(): ICommand {
    return {
        text_data: {
            name: "download",
            description: i18next.t('commands:download_desc'),
            arguments: [new CommandArgument(i18next.t('commands:play_arg_link', {services: services}), true)],
            execute: async (message, args) => {
                const songQuery = args.join(" ")

                const downloadLink = await getDownloadLink(message.client, songQuery)

                if (downloadLink){
                    await message.reply({embeds: [generateDownloadSongEmbed(downloadLink)]})
                }else{
                    await message.reply({embeds: [generateErrorEmbed(i18next.t("audioplayer:download_song_error"))]})
                }
            }
        },
        slash_data: {
            slash_builder: new SlashCommandBuilder()
                .setName("download")
                .setDescription(i18next.t('commands:download_desc'))
                .addStringOption(option =>
                    option
                        .setName('request')
                        .setNameLocalizations({
                            ru: 'запрос'
                        })
                        .setDescription(i18next.t('commands:play_arg_link', {services: services}))
                        .setRequired(true)),
            execute: async (interaction) => {
                const songQuery = interaction.options.getString('request')!

                const downloadLink = await getDownloadLink(interaction.client, songQuery)

                if (downloadLink){
                    await interaction.reply({embeds: [generateDownloadSongEmbed(downloadLink)]})
                }else{
                    await interaction.reply({embeds: [generateErrorEmbed(i18next.t("audioplayer:download_song_error"))]})
                }
            },
        },
        group: GroupAudio,
        bot_permissions: [
            PermissionsBitField.Flags.SendMessages,
        ],
    }
}

export function generateDownloadSongEmbed(songStreamUrl: string){
    return new EmbedBuilder()
        .setTitle(i18next.t("audioplayer:download_song_press_link"))
        .setURL(songStreamUrl)
}
