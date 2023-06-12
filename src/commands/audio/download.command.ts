import {CommandArgument, ICommand} from "../../CommandTypes.js";
import {
    PermissionsBitField,
    SlashCommandBuilder,
} from "discord.js";
import {GroupAudio} from "./AudioTypes.js";
import {services, songSearchAutocomplete} from "./play.command.js";
import {getDownloadLink} from "./audioPlayer/getDownloadLink.js";
import i18next from "i18next";

export default function(): ICommand {
    return {
        text_data: {
            name: "download",
            description: i18next.t('commands:download_desc'),
            arguments: [new CommandArgument(i18next.t('commands:play_arg_link', {services: services}), true)],
            execute: async (message, args) => {
                const songQuery = args.join(" ")

                await message.reply({content: await getDownloadLink(message.client, songQuery)})
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
                        .setAutocomplete(true)
                        .setRequired(true)),
            autocomplete: songSearchAutocomplete,
            execute: async (interaction) => {
                const songQuery = interaction.options.getString('request')!

                await interaction.reply({content: await getDownloadLink(interaction.client, songQuery)})
            },
        },
        group: GroupAudio,
        bot_permissions: [
            PermissionsBitField.Flags.SendMessages,
        ],
    }
}
