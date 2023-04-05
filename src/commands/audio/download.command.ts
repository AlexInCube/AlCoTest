import {ICommand} from "../../CommandTypes";
import {
    PermissionsBitField,
    SlashCommandBuilder,
} from "discord.js";
import {GroupAudio} from "./AudioTypes";
import {songSearchAutocomplete} from "./play.command";
import {getDownloadLink} from "./audioPlayer/getDownloadLink";

const command : ICommand = {
    name: "download",
    description: 'Даёт ссылку на скачивание песни',
    slash_builder: new SlashCommandBuilder()
        .setName("download")
        .setDescription('Даёт ссылку на скачивание песни')
        .addStringOption(option =>
            option
                .setName('request')
                .setNameLocalizations({
                    ru: 'запрос'
                })
                .setDescription('Ссылка с Youtube/Spotify/Soundcloud или любой текст')
                .setAutocomplete(true)
                .setRequired(true)),
    autocomplete: songSearchAutocomplete,
    group: GroupAudio,
    bot_permissions: [
        PermissionsBitField.Flags.SendMessages,
    ],
    execute: async (interaction) => {
        const songQuery = interaction.options.getString('request')!

        await interaction.reply({content: await getDownloadLink(songQuery)})
    },
    executeText: async (message, args) => {
        const songQuery = args.join(" ")

        await message.reply({content: await getDownloadLink(songQuery)})
    }
}

export default command
