import {ICommand, CommandArgument} from "../../CommandTypes";
import {
    GuildMember,
    PermissionsBitField,
    SlashCommandBuilder,
    TextChannel,
    User,
    VoiceChannel
} from "discord.js";
import {GroupAudio} from "./AudioTypes";
import {AudioPlayerEmbedBuilder} from "./audioPlayer/AudioPlayerEmbedBuilder";
import {Audio} from "../../main";
import {checkMemberInVoice} from "./audioPlayer/util/checkMemberInVoice";

const command : ICommand = {
    name: "play",
    description: 'Проигрывает музыку указанную пользователем',
    arguments: [new CommandArgument('Ссылка с Youtube/Spotify/Soundcloud или любой текст', true)],
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
    execute: async (interaction, ) => {
        const songQuery = interaction.options.getString('request')

        await interaction.reply("ok")
        await interaction.deleteReply()

        const member = interaction.member as GuildMember
        if (checkMemberInVoice(member) && songQuery) {
            await Audio.play(member.voice.channel as VoiceChannel, interaction.channel as TextChannel, songQuery, {
                member: interaction.member as GuildMember,
                textChannel:  interaction.channel as TextChannel
            })
        }
    },
    executeText: async (message, args) => {
        const songQuery = args.join(" ")

        const member = message.member as GuildMember
        if (checkMemberInVoice(member)) {
            await Audio.play(member.voice.channel as VoiceChannel, message.channel as TextChannel, songQuery, {
                member: message.member as GuildMember,
                textChannel:  message.channel as TextChannel
            })
        }
    }
}

export default command