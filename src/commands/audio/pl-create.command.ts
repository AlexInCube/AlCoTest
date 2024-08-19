import { CommandArgument, ICommand } from '../../CommandTypes.js';
import { GroupAudio } from './AudioTypes.js';
import { ChatInputCommandInteraction, Message, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import i18next from 'i18next';
import {
  PlaylistAlreadyExists,
  PlaylistMaxPlaylistsCount,
  PlaylistNameMaxLength,
  PlaylistNameMinLength,
  UserPlaylistCreate
} from '../../schemas/SchemaPlaylist.js';
import { generateSimpleEmbed } from '../../utilities/generateSimpleEmbed.js';
import { generateErrorEmbed } from '../../utilities/generateErrorEmbed.js';
import { ENV } from '../../EnvironmentVariables.js';
import { loggerError } from '../../utilities/logger.js';

export default function (): ICommand {
  return {
    text_data: {
      name: 'pl-create',
      description: i18next.t('commands:pl-create_desc'),
      arguments: [new CommandArgument(i18next.t('commands:pl_arg_name'), true)],
      execute: async (message: Message, args: Array<string>) => {
        const songQuery = args.join(' ');

        await plCreateAndReply(songQuery, message, message.author.id);
      }
    },
    slash_data: {
      slash_builder: new SlashCommandBuilder()
        .setName('pl-create')
        .setDescription(i18next.t('commands:pl-create_desc'))
        .addStringOption((option) =>
          option
            .setName('playlist_name')
            .setDescription(i18next.t('commands:pl_arg_name'))
            .setRequired(true)
            .setMinLength(PlaylistNameMinLength)
            .setMaxLength(PlaylistNameMaxLength)
        ),
      execute: async (interaction) => {
        const playlistName = interaction.options.getString('playlist_name')!;

        await plCreateAndReply(playlistName, interaction, interaction.user.id);
      }
    },
    group: GroupAudio,
    bot_permissions: [PermissionsBitField.Flags.SendMessages]
  };
}

async function plCreateAndReply(playlistName: string, ctx: Message | ChatInputCommandInteraction, userID: string) {
  try {
    await UserPlaylistCreate(userID, playlistName);

    await ctx.reply({
      embeds: [
        generateSimpleEmbed(
          i18next.t('commands:pl-create_success', { name: playlistName, interpolation: { escapeValue: false } })
        )
      ],
      ephemeral: true
    });
  } catch (e) {
    if (e instanceof PlaylistAlreadyExists) {
      await ctx.reply({
        embeds: [
          generateErrorEmbed(
            i18next.t('commands:pl-create_error_duplicate', {
              name: playlistName,
              interpolation: { escapeValue: false }
            })
          )
        ],
        ephemeral: true
      });
      return;
    }

    if (e instanceof PlaylistMaxPlaylistsCount) {
      await ctx.reply({
        embeds: [
          generateErrorEmbed(
            i18next.t('commands:pl-create_error_max_playlists_count', {
              count: ENV.BOT_MAX_PLAYLISTS_PER_USER
            })
          )
        ],
        ephemeral: true
      });
      return;
    }

    if (e.name === 'ValidationError') {
      await ctx.reply({
        embeds: [
          generateErrorEmbed(
            i18next.t('commands:pl-create_error_validation', {
              min: PlaylistNameMinLength,
              max: PlaylistNameMaxLength
            })
          )
        ],
        ephemeral: true
      });
      return;
    }

    await ctx.reply({ embeds: [generateErrorEmbed(i18next.t('commands:pl-create_error'))], ephemeral: true });
    if (ENV.BOT_VERBOSE_LOGGING) loggerError(e);
  }
}
