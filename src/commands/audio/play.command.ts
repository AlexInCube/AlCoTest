import {ICommand, CommandArgument} from "../../CommandTypes";
import {PermissionsBitField, SlashCommandBuilder, User} from "discord.js";
import {GroupAudio} from "./AudioTypes";
import {AudioPlayerEmbedBuilder} from "./audioPlayer/AudioPlayerEmbedBuilder";

const command : ICommand = {
    name: "play",
    description: 'Проигрывает музыку указанную пользователем',
    arguments: [new CommandArgument('Ссылка с Youtube/Spotify/Soundcloud или любой текст', false)],
    slash_builder: new SlashCommandBuilder()
        .setName("play")
        .setDescription('Проигрывает музыку указанную пользователем.')
        .addStringOption(option =>
            option
                .setName('request')
                .setNameLocalizations({
                    ru: 'запрос'
                })
                .setDescription('Ссылка с Youtube/Spotify/Soundcloud или любой текст')
                .setAutocomplete(true)
                .setRequired(true)),
    group: GroupAudio,
    bot_permissions: [
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.Connect,
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.Speak,
        PermissionsBitField.Flags.ManageMessages,
        PermissionsBitField.Flags.AttachFiles
    ],
    execute: async (interaction) => {
        await interaction.reply({
            embeds: [BuildEmbed(interaction.user)]
        })
    },
    executeText: async (message) => {
        await message.reply({
            embeds: [BuildEmbed(message!.member!.user!)]
        })
    }
}

function BuildEmbed(user: User){
    const builder = new AudioPlayerEmbedBuilder()
    builder.setPlayerState("playing")
    builder.setSongTitle("КИШ - ДЖОКЕР", "https://www.youtube.com/watch?v=NdtZFrSHDd4")
    builder.setRequester(user)
    builder.setThumbnail("https://sun9-19.userapi.com/impg/T4DP3HRr5wJ5glwdmX-PHWxWMkw9uR_ApwZcCQ/w0z1kcfbUYE.jpg?size=453x604&quality=96&sign=dc142311a6ef2b833c6db43303857af4&type=album")

    return builder.getEmbed()
}

export default command