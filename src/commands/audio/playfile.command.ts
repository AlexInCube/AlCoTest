import {ICommand} from "../../CommandTypes";
import {
    GuildMember,
    PermissionsBitField,
    SlashCommandBuilder,
    TextChannel,
    VoiceChannel
} from "discord.js";
import {GroupAudio} from "./AudioTypes";
import {Audio} from "../../main";
import {isAudioFile} from "./util/isAudioFile";
import {generateErrorEmbed} from "../../utilities/generateErrorEmbed";

const command : ICommand = {
    name: "playfile",
    description: 'Проигрывает музыку из прикреплённого файла',
    slash_builder: new SlashCommandBuilder()
        .setName("playfile")
        .setDescription('Проигрывает музыку из прикреплённого файла')
        .addAttachmentOption(option =>
            option
                .setName('file')
                .setNameLocalizations({
                    ru: 'файл'
                })
                .setDescription('Прикреплённый файл')
                .setRequired(true)
        ),
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
        const musicFile = interaction.options.getAttachment('file', true)

        if (!isAudioFile(musicFile.name)){
            await interaction.reply({ embeds: [generateErrorEmbed('Это не аудиофайл, это чёрт пойми что! Мне надо mp3/wav/ogg')], ephemeral: true })
            return
        }

        await interaction.reply({
            content: `Я думаю`,
        });
        await interaction.deleteReply();

        const member = interaction.member as GuildMember
        if (musicFile) {
            await Audio.play(member.voice.channel as VoiceChannel, interaction.channel as TextChannel, musicFile.url, {
                member: interaction.member as GuildMember,
                textChannel:  interaction.channel as TextChannel
            })
        }
    },
    executeText: async (message) => {
        const musicFile = message.attachments.first()

        if (!musicFile){
            await message.reply({ embeds: [generateErrorEmbed('Вы должны прикрепить аудиофайл с форматом mp3/wav/ogg')] })
            return
        }

        if (!isAudioFile(musicFile.name)){
            await message.reply({ embeds: [generateErrorEmbed('Это не аудиофайл, это чёрт пойми что! Мне надо mp3/wav/ogg')] })
            return
        }

        const member = message.member as GuildMember
        await Audio.play(member.voice.channel as VoiceChannel, message.channel as TextChannel, musicFile.url, {
            member: message.member as GuildMember,
            textChannel:  message.channel as TextChannel
        })

        await message.delete()
    }
}

export default command