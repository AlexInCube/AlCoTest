import { EmbedBuilder } from 'discord.js';
import i18next from 'i18next';
import { getIconFromSource } from './getIconFromSource.js';
import { Track } from 'riffy';
import { formatMilliseconds } from '../../utilities/formatMillisecondsToTime.js';

export function generateAddedSongMessage(song: Track) {
  const serviceIcon = getIconFromSource(song.info.sourceName);

  return new EmbedBuilder()
    .setTitle(song.info.title ? `${serviceIcon} ${song.info.title}` : i18next.t('audioplayer:player_embed_unknown'))
    .setURL(song.info.uri ?? null)
    .setAuthor({ name: `${i18next.t('audioplayer:event_add_song')}` })
    .setThumbnail(song.info.thumbnail ?? null)
    .addFields(
      {
        name: `${i18next.t('audioplayer:player_embed_requester')}`,
        value: `${song.info.requester}`,
        inline: true
      },
      {
        name: `${i18next.t('audioplayer:event_add_song_length')}`,
        value: `\`${formatMilliseconds(song.info.length)}\``,
        inline: true
      },
      {
        name: `${i18next.t('audioplayer:event_add_song_author')}`,
        value: `\`${song.info.author ?? i18next.t('audioplayer:player_embed_unknown')}\``,
        inline: true
      }
    );
}
