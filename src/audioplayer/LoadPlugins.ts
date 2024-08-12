import { ExtractorPlugin, InfoExtractorPlugin, PlayableExtractorPlugin } from 'distube';
import { ENV } from '../EnvironmentVariables.js';
import { loggerError, loggerSend, loggerWarn } from '../utilities/logger.js';
import { SpotifyPlugin } from '@distube/spotify';
import { YtDlpPlugin } from '@distube/yt-dlp';
import { YouTubePlugin } from '@distube/youtube';
import { DirectLinkPlugin } from '@distube/direct-link';
import { FilePlugin } from '@distube/file';
import { AppleMusicPlugin } from 'distube-apple-music';
import { YandexMusicPlugin } from 'distube-yandex-music-plugin';
import { SoundCloudPlugin } from './plugins/soundcloud.js';
import { getYoutubeCookie } from '../CookiesAutomation.js';
import Cron from 'node-cron';

import fs from 'fs';

const loggerPrefixAudioplayerPluginsLoader = 'Audioplayer Plugin Loader';

export type DistubePlugin = ExtractorPlugin | InfoExtractorPlugin | PlayableExtractorPlugin;

const YtPlugin = new YouTubePlugin({});

export async function LoadPlugins(): Promise<Array<DistubePlugin>> {
  const plugins: Array<DistubePlugin> = [];

  await loadPluginsPartYoutube(plugins);

  if (!ENV.BOT_SPOTIFY_CLIENT_ID || !ENV.BOT_SPOTIFY_CLIENT_SECRET) {
    loggerWarn(
      'Spotify plugin can work worse, because BOT_SPOTIFY_CLIENT_ID and BOT_SPOTIFY_CLIENT_SECRET are wrong or not provided',
      loggerPrefixAudioplayerPluginsLoader
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
      loggerPrefixAudioplayerPluginsLoader
    );
  }

  if (!ENV.BOT_SOUNDCLOUD_CLIENT_ID || !ENV.BOT_SOUNDCLOUD_TOKEN) {
    loggerWarn(
      'Some Soundcloud features is disabled, because BOT_SOUNDCLOUD_CLIENT_ID or BOT_SOUNDCLOUD_TOKEN are wrong or not provided',
      loggerPrefixAudioplayerPluginsLoader
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

  // YouTube Plugin and YtDLP are different thing
  plugins.push(
    new YtDlpPlugin({
      update: true
    })
  );

  loggerSend(
    `Loaded plugins: ${plugins.map((plugin: DistubePlugin) => {
      return ' ' + plugin.constructor.name;
    })}`,
    loggerPrefixAudioplayerPluginsLoader
  );

  return plugins;
}

function setupYtCookieSchedule() {
  if (ENV.BOT_GOOGLE_EMAIL && ENV.BOT_GOOGLE_PASSWORD) {
    loggerSend(
      'Google data is provided, setup cron job for cookies fetching',
      loggerPrefixAudioplayerPluginsLoader
    );
    Cron.schedule('0 0 * * *', async () => {
      const cookies = await getYoutubeCookie();
      if (!cookies) return;
      YtPlugin.cookies = cookies;
      loggerSend(
        'Cookies is fetched again through Google Auth',
        loggerPrefixAudioplayerPluginsLoader
      );
    });
  }
}

async function loadPluginsPartYoutube(plugins: Array<DistubePlugin>) {
  plugins.push(YtPlugin);

  setupYtCookieSchedule();

  if (fs.existsSync('yt-cookies.json')) {
    try {
      YtPlugin.cookies = JSON.parse(
        fs.readFileSync('yt-cookies.json', { encoding: 'utf8', flag: 'r' })
      );
      loggerSend("'yt-cookies.json' is loaded", loggerPrefixAudioplayerPluginsLoader);
    } catch (e) {
      loggerError("'yt-cookies.json' error when parsing", loggerPrefixAudioplayerPluginsLoader);
      if (ENV.BOT_GOOGLE_EMAIL && ENV.BOT_GOOGLE_PASSWORD) {
        YtPlugin.cookies = await getYoutubeCookie();
      }
    }
  } else {
    loggerWarn("'yt-cookies.json' not found", loggerPrefixAudioplayerPluginsLoader);

    if (ENV.BOT_GOOGLE_EMAIL && ENV.BOT_GOOGLE_PASSWORD) {
      loggerSend('Trying to fetch cookie from Google Auth, this might be take a time');
      YtPlugin.cookies = await getYoutubeCookie();
    }
  }

  if (YtPlugin.cookies === undefined) {
    loggerWarn(
      'Could not find any cookies, Please, follow instructions in README.md',
      loggerPrefixAudioplayerPluginsLoader
    );
  }
}
