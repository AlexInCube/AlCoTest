import { Song } from 'distube';
import { EmbedBuilder } from 'discord.js';
import i18next from 'i18next';

export function generateAddedSongMessage(song: Song) {
  return new EmbedBuilder()
    .setTitle(song.name ?? i18next.t('audioplayer:player_embed_unknown'))
    .setURL(song.url ?? null)
    .setAuthor({ name: `🎵${i18next.t('audioplayer:event_add_song')}🎵` })
    .setThumbnail(song.thumbnail ?? null)
    .addFields(
      {
        name: `${i18next.t('audioplayer:player_embed_requester')}`,
        value: `${song.member!.user.toString()}`,
        inline: true
      },
      {
        name: `${i18next.t('audioplayer:event_add_song_length')}`,
        value: `\`${song.formattedDuration}\``,
        inline: true
      },
      {
        name: `${i18next.t('audioplayer:event_add_song_author')}`,
        value: `\`${song.uploader.name ?? i18next.t('audioplayer:player_embed_unknown')}\``,
        inline: true
      }
    );
}
