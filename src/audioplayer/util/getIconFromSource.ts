import { AudioSourceIcons } from '../AudioPlayerIcons.js';
import { VK_MUSIC_PLUGIN_SOURCE } from 'distube-vk-music-plugin';

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
    case VK_MUSIC_PLUGIN_SOURCE:
      return AudioSourceIcons.vkontakte;
    default:
      return AudioSourceIcons.other;
  }
}
