import { EmbedBuilder } from 'discord.js';
import i18next from 'i18next';
import { getIconFromSource } from './getIconFromSource.js';
import { nodeResponse } from 'riffy';
import { formatMilliseconds } from '../../utilities/formatMillisecondsToTime.js';
import { playlistCalculateDuration } from './playlistCalculateDuration.js';

export function generateAddedPlaylistMessage(playlist: nodeResponse) {
  const serviceIcon = getIconFromSource(playlist.tracks[0].info.sourceName ?? undefined);

  return (
    new EmbedBuilder()
      .setTitle(
        playlist.playlistInfo?.name
          ? `${serviceIcon} ${playlist.playlistInfo.name}`
          : i18next.t('audioplayer:player_embed_unknown')
      )
      // @ts-expect-error because
      .setURL(playlist.pluginInfo?.url ?? null)
      .setAuthor({ name: `${i18next.t('audioplayer:event_add_list')}` })
      .setThumbnail(playlist.tracks[0].info.thumbnail ?? null)
      .addFields(
        {
          name: `${i18next.t('audioplayer:player_embed_requester')}`,
          value: `${playlist.tracks[0].info.requester}`,
          inline: true
        },
        {
          name: `${i18next.t('audioplayer:event_add_list_songs_count')}`,
          value: `\`${playlist.tracks.length}\``,
          inline: true
        },
        {
          name: `${i18next.t('audioplayer:event_add_song_length')}`,
          value: `\`${formatMilliseconds(playlistCalculateDuration(playlist.tracks))}\``,
          inline: true
        }
      )
  );
}
