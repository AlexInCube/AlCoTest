import { getNoun } from '../../utilities/getNoun.js';
import i18next from 'i18next';

export function getSongsNoun(songsSize: number) {
  return getNoun(
    songsSize,
    i18next.t('audioplayer:player_embed_queue_noun_one'),
    i18next.t('audioplayer:player_embed_queue_noun_two'),
    i18next.t('audioplayer:player_embed_queue_noun_five')
  );
}
