import { ICommand } from '../../CommandTypes.js';
import {
  GuildMember,
  Message,
  PermissionsBitField,
  SlashCommandBuilder,
  TextChannel,
  VoiceChannel
} from 'discord.js';
import { GroupAudio } from './AudioTypes.js';
import { isAudioFile } from '../audioPlayer/util/isAudioFile.js';
import { generateErrorEmbed } from '../../utilities/generateErrorEmbed.js';
import i18next from 'i18next';

const audioFormats = { formats: 'mp3/wav/ogg' };

export default function (): ICommand {
  return {
    text_data: {
      name: 'playfile',
      description: i18next.t('commands:play_file_desc'),
      execute: async (message: Message) => {
        const musicFile = message.attachments.first();

        if (!musicFile) {
          await message.reply({
            embeds: [
              generateErrorEmbed(i18next.t('commands:play_file_missing_attachment', audioFormats))
            ]
          });
          return;
        }

        if (!isAudioFile(musicFile.name)) {
          await message.reply({
            embeds: [generateErrorEmbed(i18next.t('commands:play_file_wrong_format', audioFormats))]
          });
          return;
        }

        const member = message.member as GuildMember;
        await message.client.audioPlayer.play(
          member.voice.channel as VoiceChannel,
          message.channel as TextChannel,
          musicFile.url,
          {
            member: message.member as GuildMember,
            textChannel: message.channel as TextChannel
          }
        );

        await message.delete();
      }
    },
    slash_data: {
      slash_builder: new SlashCommandBuilder()
        .setName('playfile')
        .setDescription(i18next.t('commands:play_file_desc'))
        .addAttachmentOption((option) =>
          option
            .setName('file')
            .setDescription(i18next.t('commands:play_file_arg_file'))
            .setRequired(true)
        ),
      execute: async (interaction) => {
        const musicFile = interaction.options.getAttachment('file', true);

        if (!isAudioFile(musicFile.name)) {
          await interaction.reply({
            embeds: [
              generateErrorEmbed(i18next.t('commands:play_file_wrong_format', audioFormats))
            ],
            ephemeral: true
          });
          return;
        }

        await interaction.reply({
          content: i18next.t('general:thinking') as string
        });
        await interaction.deleteReply();

        const member = interaction.member as GuildMember;
        if (musicFile) {
          await interaction.client.audioPlayer.play(
            member.voice.channel as VoiceChannel,
            interaction.channel as TextChannel,
            musicFile.url,
            {
              member: interaction.member as GuildMember,
              textChannel: interaction.channel as TextChannel
            }
          );
        }
      }
    },
    guild_data: {
      guild_only: true,
      voice_required: true
    },
    group: GroupAudio,
    bot_permissions: [
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.Connect,
      PermissionsBitField.Flags.ViewChannel,
      PermissionsBitField.Flags.Speak,
      PermissionsBitField.Flags.ManageMessages,
      PermissionsBitField.Flags.AttachFiles
    ]
  };
}
