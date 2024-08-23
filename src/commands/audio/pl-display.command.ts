import { CommandArgument, ICommand, ReplyContext } from '../../CommandTypes.js';
import { GroupAudio } from './AudioTypes.js';
import { EmbedBuilder, Message, PermissionsBitField, SlashCommandBuilder, User } from 'discord.js';
import i18next from 'i18next';
import {
  ISchemaPlaylist,
  PlaylistNameMaxLength,
  PlaylistNameMinLength,
  UserPlaylistGet,
  UserPlaylistNamesAutocomplete
} from '../../schemas/SchemaPlaylist.js';
import { generateErrorEmbed } from '../../utilities/generateErrorEmbed.js';
import { PaginationList } from '../../audioplayer/PaginationList.js';
import { getSongsNoun } from '../../audioplayer/util/getSongsNoun.js';

export default function (): ICommand {
  return {
    text_data: {
      name: 'pl-display',
      description: i18next.t('commands:pl-display_desc'),
      arguments: [new CommandArgument(i18next.t('commands:pl_arg_name'), true)],
      execute: async (message: Message, args: Array<string>) => {
        const playlistName = args[0];

        await plDisplayAndReply(playlistName, message, message.author);
      }
    },
    slash_data: {
      slash_builder: new SlashCommandBuilder()
        .setName('pl-display')
        .setDescription(i18next.t('commands:pl-display_desc'))
        .addStringOption((option) =>
          option
            .setName('playlist_name')
            .setDescription(i18next.t('commands:pl_arg_name'))
            .setRequired(true)
            .setAutocomplete(true)
            .setMinLength(PlaylistNameMinLength)
            .setMaxLength(PlaylistNameMaxLength)
        ),
      execute: async (interaction) => {
        const playlistName = interaction.options.getString('playlist_name')!;

        await plDisplayAndReply(playlistName, interaction, interaction.user);
      },
      autocomplete: UserPlaylistNamesAutocomplete
    },
    group: GroupAudio,
    bot_permissions: [PermissionsBitField.Flags.SendMessages]
  };
}

async function plDisplayAndReply(playlistName: string, ctx: ReplyContext, user: User) {
  const playlist = await UserPlaylistGet(user.id, playlistName, true);

  if (!playlist) {
    await ctx.reply({
      embeds: [generateErrorEmbed(i18next.t('commands:pl_error_playlist_not_exists'))],
      ephemeral: true
    });
    return;
  }

  const playlistEmbed = new EmbedBuilder().setAuthor({ name: user.displayName, iconURL: user.displayAvatarURL() });

  function buildPage(playlist: ISchemaPlaylist, pageNumber: number, entriesPerPage: number) {
    let songsList = '';

    const startingIndex = pageNumber * entriesPerPage;

    for (let i = startingIndex; i < Math.min(startingIndex + entriesPerPage, playlist.songs.length); i++) {
      const song = playlist.songs[i];

      const songDate = song.createdAt ? `<t:${Math.round(song.createdAt.getTime() / 1000)}:f>` : '<t:0:f>';

      songsList += `${i + 1}. [${song.name}](${song.url}) - ${songDate} \n`;
    }

    return (
      new EmbedBuilder()
        .setAuthor({
          name: `${user.displayName} - ${playlist.name} - ${playlist.songs.length} ${getSongsNoun(playlist.songs.length)}`,
          iconURL: user.displayAvatarURL()
        })
        //.setTitle(`${i18next.t('commands:history_embed_title')} ${guild.name}`)
        .setDescription(`${songsList}`.slice(0, 4096))
    );
  }

  if (playlist.songsSize === 0) {
    playlistEmbed.setDescription(i18next.t('commands:pl-display_embed_no_songs'));
    await ctx.reply({ embeds: [playlistEmbed], ephemeral: true });
  } else {
    const arrayEmbeds: Array<EmbedBuilder> = [];
    const entriesPerPage = 20;
    const pages = Math.ceil(playlist.songs.length / entriesPerPage);

    for (let i = 0; i < pages; i++) {
      arrayEmbeds.push(buildPage(playlist, i, entriesPerPage));
    }

    await PaginationList(ctx, arrayEmbeds, user);
  }
}
