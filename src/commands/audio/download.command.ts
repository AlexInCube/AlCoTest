import { CommandArgument, ICommand } from '../../CommandTypes.js';
import { PermissionsBitField, SlashCommandBuilder, TextChannel } from 'discord.js';
import { GroupAudio } from './AudioTypes.js';
import { services } from './play.command.js';
import {
  deleteMP3file,
  DownloadSongErrorGetLocale,
  getSongFileAttachment
} from '../../audioplayer/util/downloadSong.js';
import i18next from 'i18next';
import { generateErrorEmbed } from '../../utilities/generateErrorEmbed.js';
import { ReadStream } from 'fs';

export default function (): ICommand {
  return {
    text_data: {
      name: 'download',
      description: i18next.t('commands:download_desc'),
      arguments: [new CommandArgument(i18next.t('commands:play_arg_link', { services: services }), true)],
      execute: async (message, args) => {
        const songQuery = args.join(' ');

        const reply = await (message.channel as TextChannel).send({
          content: i18next.t('commands:download_please_wait') as string
        });

        try {
          const file = await getSongFileAttachment(message.client, songQuery);
          if (file) {
            await reply.edit({ files: [file] });
            await deleteMP3file((<ReadStream>file.attachment).path as string);
          }
        } catch (e) {
          await reply.edit({
            content: undefined,
            embeds: [generateErrorEmbed(DownloadSongErrorGetLocale(e.message))]
          });
        }
      }
    },
    slash_data: {
      slash_builder: new SlashCommandBuilder()
        .setName('download')
        .setDescription(i18next.t('commands:download_desc'))
        .addStringOption((option) =>
          option
            .setName('request')
            .setDescription(i18next.t('commands:download_arg_request', { services: services }))
            .setRequired(true)
        ),
      execute: async (interaction) => {
        const songQuery = interaction.options.getString('request')!;

        await interaction.deferReply();

        try {
          const file = await getSongFileAttachment(interaction.client, songQuery);

          if (file) {
            await interaction.editReply({ files: [file] });
            await deleteMP3file((<ReadStream>file.attachment).path as string);
          }
        } catch (e) {
          await interaction.editReply({
            embeds: [generateErrorEmbed(DownloadSongErrorGetLocale(e.message))]
          });
        }
      }
    },
    group: GroupAudio,
    bot_permissions: [PermissionsBitField.Flags.SendMessages]
  };
}
