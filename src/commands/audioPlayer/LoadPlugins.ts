import { ExtractorPlugin, InfoExtractorPlugin, PlayableExtractorPlugin } from 'distube';
import { BOT_YOUTUBE_COOKIE, ENV } from '../../EnvironmentVariables.js';
import { loggerSend, loggerWarn } from '../../utilities/logger.js';
import { SpotifyPlugin } from '@distube/spotify';
import { SoundCloudPlugin } from '@distube/soundcloud';
import { YtDlpPlugin } from '@distube/yt-dlp';
import { loggerPrefixAudioplayer } from './AudioPlayerCore.js';
import { YouTubePlugin } from '@distube/youtube';
import { DirectLinkPlugin } from '@distube/direct-link';
import { FilePlugin } from '@distube/file';
import { AppleMusicPlugin } from 'distube-apple-music';
import { YandexMusicPlugin } from 'distube-yandex-music-plugin';

export type DistubePlugin = ExtractorPlugin | InfoExtractorPlugin | PlayableExtractorPlugin;

export function LoadPlugins(): Array<DistubePlugin> {
  const plugins: Array<DistubePlugin> = [];

  if (!BOT_YOUTUBE_COOKIE) {
    loggerWarn(
      'BOT_YOUTUBE_COOKIE is not provided, 18+ videos from Youtube is not available',
      loggerPrefixAudioplayer
    );
  }

  plugins.push(
    new YouTubePlugin({
      cookies: BOT_YOUTUBE_COOKIE
    })
  );

  if (!ENV.BOT_SPOTIFY_CLIENT_ID || !ENV.BOT_SPOTIFY_CLIENT_SECRET) {
    loggerWarn(
      'Spotify plugin can work worse, because BOT_SPOTIFY_CLIENT_ID and BOT_SPOTIFY_CLIENT_SECRET are wrong or not provided',
      loggerPrefixAudioplayer
    );
  }

  plugins.push(
    new SpotifyPlugin({
      api: {
        clientId: ENV.BOT_SPOTIFY_CLIENT_ID,
        clientSecret: ENV.BOT_SPOTIFY_CLIENT_SECRET
      }
    })
  );

  if (ENV.BOT_YANDEXMUSIC_TOKEN && ENV.BOT_YANDEXMUSIC_UID) {
    plugins.push(
      new YandexMusicPlugin({
        oauthToken: ENV.BOT_YANDEXMUSIC_TOKEN,
        uid: ENV.BOT_YANDEXMUSIC_UID
      })
    );
  } else {
    loggerWarn(
      'Yandex Music plugin is disabled, because BOT_YANDEXMUSIC_TOKEN and BOT_YANDEXMUSIC_UID are wrong or not provided',
      loggerPrefixAudioplayer
    );
  }

  if (!ENV.BOT_SOUNDCLOUD_CLIENT_ID || !ENV.BOT_SOUNDCLOUD_TOKEN) {
    loggerWarn(
      'Some Soundcloud features is disabled, because BOT_SOUNDCLOUD_CLIENT_ID or BOT_SOUNDCLOUD_TOKEN are wrong or not provided',
      loggerPrefixAudioplayer
    );
  }

  plugins.push(
    new SoundCloudPlugin({
      clientId: ENV.BOT_SOUNDCLOUD_CLIENT_ID,
      oauthToken: ENV.BOT_SOUNDCLOUD_TOKEN
    })
  );

  plugins.push(new AppleMusicPlugin());
  plugins.push(new DirectLinkPlugin());
  plugins.push(new FilePlugin());
  plugins.push(
    new YtDlpPlugin({
      update: true
    })
  );

  loggerSend(
    `Loaded plugins: ${plugins.map((plugin: DistubePlugin) => {
      return ' ' + plugin.constructor.name;
    })}`,
    loggerPrefixAudioplayer
  );

  return plugins;
}
