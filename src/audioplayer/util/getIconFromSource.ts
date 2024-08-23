import { AudioSourceIcons } from '../AudioPlayerIcons.js';

export function getIconFromSource(source: string): AudioSourceIcons {
  switch (source) {
    case 'applemusic':
      return AudioSourceIcons.applemusic;
    case 'spotify':
      return AudioSourceIcons.spotify;
    case 'youtube':
      return AudioSourceIcons.youtube;
    case 'file':
      return AudioSourceIcons.attachment;
    case 'soundcloud':
      return AudioSourceIcons.soundcloud;
    case 'yandexmusic':
      return AudioSourceIcons.yandexmusic;
    default:
      return AudioSourceIcons.other;
  }
}
