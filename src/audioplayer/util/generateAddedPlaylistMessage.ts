import { Playlist } from 'distube';
import { EmbedBuilder } from 'discord.js';
import i18next from 'i18next';

export function generateAddedPlaylistMessage(playlist: Playlist) {
  return new EmbedBuilder()
    .setTitle(playlist.name ?? i18next.t('audioplayer:player_embed_unknown'))
    .setURL(playlist.url ?? null)
    .setAuthor({ name: `🎵${i18next.t('audioplayer:event_add_list')}🎵` })
    .setThumbnail(playlist.thumbnail ?? null)
    .addFields(
      {
        name: `${i18next.t('audioplayer:player_embed_requester')}`,
        value: `${playlist.member!.user.toString()}`,
        inline: true
      },
      {
        name: `${i18next.t('audioplayer:event_add_list_songs_count')}`,
        value: `\`${playlist.songs.length}\``,
        inline: true
      },
      {
        name: `${i18next.t('audioplayer:event_add_song_length')}`,
        value: `\`${playlist.formattedDuration}\``,
        inline: true
      }
    );
}
