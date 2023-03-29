import {ICommand, CommandArgument} from "../../CommandTypes";
import {
    GuildMember,
    PermissionsBitField,
    SlashCommandBuilder,
    TextChannel,
    VoiceChannel
} from "discord.js";
import {GroupAudio} from "./AudioTypes";
import {Audio} from "../../main";
import {isValidURL} from "../../utilities/isValidURL";
import {truncateString} from "../../utilities/truncateString";
import { SearchResultType, SearchResultVideo } from "distube";

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
    autocomplete: async (interaction) => {
        const focusedValue = interaction.options.getFocused()

        if (focusedValue && !isValidURL(focusedValue)) { // Если есть хоть какое-т значение и результат поиска не ссылка
            const choices = await Audio.distube.search(focusedValue, { limit: 10, type: SearchResultType.VIDEO, safeSearch: false })
            // Превращаем результаты поиска в подсказки
            const finalResult = choices.map((choice: SearchResultVideo) => {
                // Длина подсказки максимум 100 символов, поэтому пытаемся эффективно использовать это пространство
                const duration = choice.isLive ? 'Стрим' : choice.formattedDuration
                let choiceString = `${duration} | ${truncateString(choice.uploader.name ?? "", 20)} | `
                // Название видео пытается занять максимум символов, в то время как имя канала/автора может быть длиной только в 20 символов
                choiceString += truncateString(choice.name, 100 - choiceString.length)
                return {
                    name: choiceString,
                    value: choice.url
                }
            })

            await interaction.respond(finalResult)
        }
    },
    group: GroupAudio,
    guild_only: true,
    voice_required: true,
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

        await interaction.reply({
            content: `Я думаю`,
        });
        await interaction.deleteReply();

        const member = interaction.member as GuildMember
        if (songQuery) {
            await Audio.play(member.voice.channel as VoiceChannel, interaction.channel as TextChannel, songQuery, {
                member: interaction.member as GuildMember,
                textChannel:  interaction.channel as TextChannel
            })
        }
    },
    executeText: async (message, args) => {
        const songQuery = args.join(" ")

        const member = message.member as GuildMember
        await Audio.play(member.voice.channel as VoiceChannel, message.channel as TextChannel, songQuery, {
            member: message.member as GuildMember,
            textChannel:  message.channel as TextChannel
        })

        await message.delete()
    }
}

export default command