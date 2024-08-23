import { CommandArgument, ICommand, ReplyContext } from '../../CommandTypes.js';
import { GroupAudio } from './AudioTypes.js';
import { Message, PermissionsBitField, SlashCommandBuilder, User } from 'discord.js';
import i18next from 'i18next';
import {
  PlaylistIsNotExists,
  PlaylistMaxSongsLimit,
  UserPlaylistAddSong,
  UserPlaylistNamesAutocomplete
} from '../../schemas/SchemaPlaylist.js';
import { Playlist } from 'distube';
import { generateErrorEmbed } from '../../utilities/generateErrorEmbed.js';
import { ENV } from '../../EnvironmentVariables.js';
import { loggerError } from '../../utilities/logger.js';
import { isValidURL } from '../../utilities/isValidURL.js';
import { generateSimpleEmbed } from '../../utilities/generateSimpleEmbed.js';

export default function (): ICommand {
  return {
    text_data: {
      name: 'pl-add',
      description: i18next.t('commands:pl-add_desc'),
      arguments: [
        new CommandArgument(i18next.t('commands:pl_arg_name'), true),
        new CommandArgument(i18next.t('commands:pl_arg_song_url'), true)
      ],
      execute: async (message: Message, args: Array<string>) => {
        // With this we modify "args" to remove last argument and extract url
        const url = args.pop() as string;
        // Join all words for playlist name, when there is not url
        const playlistName = args.join(' ');

        await plAddAndReply(playlistName, url, message, message.author);
      }
    },
    slash_data: {
      slash_builder: new SlashCommandBuilder()
        .setName('pl-add')
        .setDescription(i18next.t('commands:pl-add_desc'))
        .addStringOption((option) =>
          option
            .setName('playlist_name')
            .setDescription(i18next.t('commands:pl_arg_name'))
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option.setName('song_url').setDescription(i18next.t('commands:pl_arg_song_url')).setRequired(true)
        ),
      execute: async (interaction) => {
        const playlistName = interaction.options.getString('playlist_name')!;
        const url = interaction.options.getString('song_url')!;

        await plAddAndReply(playlistName, url, interaction, interaction.user);
      },
      autocomplete: UserPlaylistNamesAutocomplete
    },
    group: GroupAudio,
    bot_permissions: [PermissionsBitField.Flags.SendMessages]
  };
}

async function plAddAndReply(playlistName: string, url: string, ctx: ReplyContext, user: User) {
  try {
    if (!isValidURL(url)) {
      await ctx.reply({
        embeds: [generateErrorEmbed(i18next.t('commands:pl-add_error_song_must_be_link'))],
        ephemeral: true
      });
      return;
    }

    const song = await ctx.client.audioPlayer.distube.handler
      .resolve(url)
      .then((result) => result)
      .catch((err) => loggerError(err));

    if (!song) {
      await ctx.reply({
        embeds: [generateErrorEmbed(i18next.t('commands:pl-add_error_song_must_be_support_in_bot_player'))],
        ephemeral: true
      });
      return;
    }

    if (song instanceof Playlist) {
      await ctx.reply({
        embeds: [generateErrorEmbed(i18next.t('commands:pl-add_error_song_must_not_be_playlist'))],
        ephemeral: true
      });
      return;
    }

    if (song.isLive) {
      await ctx.reply({
        embeds: [generateErrorEmbed(i18next.t('commands:pl-add_error_song_must_not_be_live_stream'))],
        ephemeral: true
      });
      return;
    }

    await UserPlaylistAddSong(user.id, playlistName, song);

    await ctx.reply({
      embeds: [
        generateSimpleEmbed(
          i18next.t('commands:pl-add_success', {
            song: song.name,
            playlist: playlistName,
            interpolation: { escapeValue: false }
          })
        )
      ],
      ephemeral: true
    });
  } catch (e) {
    if (e instanceof PlaylistIsNotExists) {
      await ctx.reply({
        embeds: [
          generateErrorEmbed(
            i18next.t('commands:pl_error_playlist_not_exists', {
              name: playlistName,
              interpolation: { escapeValue: false }
            })
          )
        ],
        ephemeral: true
      });
      return;
    }

    if (e instanceof PlaylistMaxSongsLimit) {
      await ctx.reply({
        embeds: [
          generateErrorEmbed(
            i18next.t('commands:pl-add_error_playlist_max_songs_limit', {
              name: playlistName,
              count: ENV.BOT_MAX_SONGS_IN_USER_PLAYLIST,
              interpolation: { escapeValue: false }
            })
          )
        ],
        ephemeral: true
      });
      return;
    }

    await ctx.reply({ embeds: [generateErrorEmbed(i18next.t('commands:pl-add_error_unknown'))], ephemeral: true });
    if (ENV.BOT_VERBOSE_LOGGING) loggerError(e);
  }
}
