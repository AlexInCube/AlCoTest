import { CommandArgument, ICommand, ReplyContext } from '../../CommandTypes.js';
import { GroupAudio } from './AudioTypes.js';
import {
  Guild,
  GuildMember,
  Message,
  PermissionsBitField,
  SlashCommandBuilder,
  TextChannel,
  VoiceChannel
} from 'discord.js';
import i18next from 'i18next';
import { PlaylistIsNotExists, UserPlaylistGet, UserPlaylistNamesAutocomplete } from '../../schemas/SchemaPlaylist.js';
import { queueSongsIsFull } from '../../audioplayer/util/queueSongsIsFull.js';
import { generateWarningEmbed } from '../../utilities/generateWarningEmbed.js';
import { ENV } from '../../EnvironmentVariables.js';
import { generateErrorEmbed } from '../../utilities/generateErrorEmbed.js';
import { loggerError } from '../../utilities/logger.js';
import { commandEmptyReply } from '../../utilities/commandEmptyReply.js';
import { nodeResponse, Track } from 'riffy';
import { undefined } from 'zod';

export default function (): ICommand {
  return {
    text_data: {
      name: 'pl-play',
      description: i18next.t('commands:pl-play_desc'),
      arguments: [new CommandArgument(i18next.t('commands:pl_arg_name'), true)],
      execute: async (message: Message, args: Array<string>) => {
        const playlistName = args.join(' ');

        await plPlayAndReply(message, playlistName, message.author.id);
      }
    },
    slash_data: {
      slash_builder: new SlashCommandBuilder()
        .setName('pl-play')
        .setDescription(i18next.t('commands:pl-play_desc'))
        .addStringOption((option) =>
          option
            .setName('playlist_name')
            .setDescription(i18next.t('commands:pl_arg_name'))
            .setAutocomplete(true)
            .setRequired(true)
        ),
      execute: async (interaction) => {
        const playlistName = interaction.options.getString('playlist_name')!;

        await plPlayAndReply(interaction, playlistName, interaction.user.id);
      },
      autocomplete: UserPlaylistNamesAutocomplete
    },
    group: GroupAudio,
    guild_data: {
      guild_only: true,
      voice_required: true
    },
    bot_permissions: [
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.Connect,
      PermissionsBitField.Flags.ViewChannel,
      PermissionsBitField.Flags.Speak,
      PermissionsBitField.Flags.ManageMessages
    ]
  };
}

async function plPlayAndReply(ctx: ReplyContext, playlistName: string, userID: string) {
  try {
    if (queueSongsIsFull(ctx.client, ctx.guild as Guild)) {
      await ctx.reply({
        embeds: [
          generateWarningEmbed(
            i18next.t('commands:play_error_songs_limit', {
              queueLimit: ENV.BOT_MAX_SONGS_IN_QUEUE
            }) as string
          )
        ],
        ephemeral: true
      });
      return;
    }
    const userPlaylist = await UserPlaylistGet(userID, playlistName, true);

    if (userPlaylist.songs.length === 0) {
      await ctx.reply({
        embeds: [
          generateErrorEmbed(
            i18next.t('commands:pl-play_error_empty_playlist', {
              name: playlistName,
              interpolation: { escapeValue: false }
            })
          )
        ],
        ephemeral: true
      });
      return;
    }

    // @ts-expect-error flatMap can return empty array, but TS thinks it never returns
    const tracks: Array<Track> = await Promise.all(
      userPlaylist.songs.flatMap(async (userSong) => {
        const nodeResponse = await ctx.client.audioPlayer.resolve(userSong.url, userID);
        if (!nodeResponse) return [];
        if (nodeResponse.loadType === 'playlist') return [];
        return nodeResponse.tracks[0];
      })
    );

    const finalResponse: nodeResponse = {
      exception: null,
      loadType: 'playlist',
      playlistInfo: {
        name: userPlaylist.name,
        selectedTrack: 0
      },
      pluginInfo: undefined,
      tracks: tracks
    };

    await commandEmptyReply(ctx);

    const member = ctx.member as GuildMember;

    await ctx.client.audioPlayer.play(
      member.voice.channel as VoiceChannel,
      ctx.channel as TextChannel,
      finalResponse,
      member
    );
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

    await ctx.reply({ embeds: [generateErrorEmbed(i18next.t('commands:pl-play_error_unknown'))], ephemeral: true });
    if (ENV.BOT_VERBOSE_LOGGING) loggerError(e);
  }
}
