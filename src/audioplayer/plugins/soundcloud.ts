import { Soundcloud } from 'soundcloud.ts';
import { DisTubeError, ExtractorPlugin, Playlist, Song, checkInvalidKey } from 'distube';
import type { ResolveOptions } from 'distube';
import type { SoundcloudPlaylistV2, SoundcloudTrackV2 } from 'soundcloud.ts';

type Falsy = undefined | null | false | 0 | '';
const isTruthy = <T>(x: T | Falsy): x is T => Boolean(x);
export enum SearchType {
  Track = 'track',
  Playlist = 'playlist'
}

export interface SoundCloudPluginOptions {
  clientId?: string;
  oauthToken?: string;
}

export class SoundCloudPlugin extends ExtractorPlugin {
  soundcloud: Soundcloud;
  constructor(options: SoundCloudPluginOptions = {}) {
    super();
    if (typeof options !== 'object' || Array.isArray(options)) {
      throw new DisTubeError(
        'INVALID_TYPE',
        ['object', 'undefined'],
        options,
        'SoundCloudPluginOptions'
      );
    }
    checkInvalidKey(options, ['clientId', 'oauthToken'], 'SoundCloudPluginOptions');
    if (options.clientId && typeof options.clientId !== 'string') {
      throw new DisTubeError('INVALID_TYPE', 'string', options.clientId, 'clientId');
    }
    if (options.oauthToken && typeof options.oauthToken !== 'string') {
      throw new DisTubeError('INVALID_TYPE', 'string', options.oauthToken, 'oauthToken');
    }

    this.soundcloud = new Soundcloud(options.clientId, options.oauthToken);
  }
  search<T>(
    query: string,
    type?: SearchType.Track,
    limit?: number,
    options?: ResolveOptions<T>
  ): Promise<Song<T>[]>;
  search<T>(
    query: string,
    type: SearchType.Playlist,
    limit?: number,
    options?: ResolveOptions<T>
  ): Promise<Playlist<T>[]>;
  search<T>(
    query: string,
    type?: SearchType,
    limit?: number,
    options?: ResolveOptions<T>
  ): Promise<Song<T>[] | Playlist<T>[]>;
  async search<T>(
    query: string,
    type: SearchType = SearchType.Track,
    limit = 10,
    options: ResolveOptions<T> = {}
  ) {
    if (typeof query !== 'string') {
      throw new DisTubeError('INVALID_TYPE', 'string', query, 'query');
    }
    if (!Object.values(SearchType).includes(type)) {
      throw new DisTubeError('INVALID_TYPE', Object.values(SearchType), type, 'type');
    }
    if (typeof limit !== 'number' || limit < 1 || !Number.isInteger(limit)) {
      throw new DisTubeError('INVALID_TYPE', 'natural number', limit, 'limit');
    }
    if (typeof options !== 'object' || Array.isArray(options)) {
      throw new DisTubeError('INVALID_TYPE', 'object', options, 'ResolveOptions');
    }

    await this.soundcloud.api.getClientId().catch(() => {
      throw new DisTubeError(
        'SOUNDCLOUD_PLUGIN_NO_CLIENT_ID',
        'Cannot find SoundCloud client id automatically. Please provide a client id in the constructor.\nGuide: https://github.com/distubejs/soundcloud#documentation'
      );
    });

    switch (type) {
      case SearchType.Track: {
        const data = await this.soundcloud.tracks.searchV2({ q: query, limit });
        if (!data?.collection?.length) {
          throw new DisTubeError(
            'SOUNDCLOUD_PLUGIN_NO_RESULT',
            `Cannot find any "${query}" ${type} on SoundCloud!`
          );
        }
        return data.collection.map((t: any) => new SoundCloudSong(this, t, options));
      }
      case SearchType.Playlist: {
        const data = await this.soundcloud.playlists.searchV2({ q: query, limit });
        const playlists = data.collection;
        return (
          await Promise.all(
            playlists.map(
              async (p: any) =>
                new SoundCloudPlaylist(this, await this.soundcloud.playlists.fetch(p), options)
            )
          )
        ).filter(isTruthy);
      }
      default:
        throw new DisTubeError(
          'SOUNDCLOUD_PLUGIN_UNSUPPORTED_TYPE',
          `${type} search is not supported!`
        );
    }
  }

  validate(url: string) {
    return /^https?:\/\/(?:(?:www|m)\.)?soundcloud\.com\/(.*)$/.test(url);
  }

  async resolve<T>(url: string, options: ResolveOptions<T>) {
    await this.soundcloud.api.getClientId().catch(() => {
      throw new DisTubeError(
        'SOUNDCLOUD_PLUGIN_NO_CLIENT_ID',
        'Cannot find SoundCloud client id automatically. Please provide a client id in the constructor.\nGuide: https://github.com/distubejs/soundcloud#documentation'
      );
    });
    const opt = { ...options, source: 'soundcloud' };
    url = url.replace(/:\/\/(m|www)\./g, '://');
    const data = await this.soundcloud.resolve.getV2(url, true).catch((e: { message: string }) => {
      throw new DisTubeError('SOUNDCLOUD_PLUGIN_RESOLVE_ERROR', e.message);
    });
    if (!data || !['track', 'playlist'].includes(data.kind)) {
      throw new DisTubeError(
        'SOUNDCLOUD_PLUGIN_NOT_SUPPORTED',
        'Only public tracks and playlists are supported.'
      );
    }

    return data.kind === 'playlist'
      ? new SoundCloudPlaylist(this, await this.soundcloud.playlists.fetch(data), opt)
      : new SoundCloudSong(this, data, opt);
  }

  async getRelatedSongs(song: SoundCloudSong<undefined>) {
    if (!song.url) {
      throw new DisTubeError(
        'SOUNDCLOUD_PLUGIN_INVALID_SONG',
        'Cannot get related songs from invalid song.'
      );
    }
    const related = await this.soundcloud.tracks.relatedV2(song.url, 10);
    return related
      .filter((t: { title: any }) => t.title)
      .map((t: any) => new SoundCloudSong(this, t));
  }

  async getStreamURL<T>(song: SoundCloudSong<T>) {
    if (!song.url) {
      throw new DisTubeError(
        'SOUNDCLOUD_PLUGIN_INVALID_SONG',
        'Cannot get stream url from invalid song.'
      );
    }
    const stream = await this.soundcloud.util.streamLink(song.url);
    if (!stream) {
      throw new DisTubeError(
        'SOUNDCLOUD_PLUGIN_RATE_LIMITED',
        'Reached SoundCloud rate limits\nSee more: https://developers.soundcloud.com/docs/api/rate-limits#play-requests'
      );
    }
    return stream;
  }

  async searchSong<T>(query: string, options: ResolveOptions<T>) {
    const songs = await this.search(query, SearchType.Track, 1, options);
    return songs[0];
  }
}

class SoundCloudSong<T> extends Song<T> {
  constructor(plugin: SoundCloudPlugin, info: SoundcloudTrackV2, options: ResolveOptions<T> = {}) {
    super(
      {
        plugin,
        source: 'soundcloud',
        playFromSource: true,
        id: info.id.toString(),
        name: info.title,
        url: info.permalink_url,
        thumbnail: info.artwork_url,
        duration: info.duration / 1000,
        views: info.playback_count,
        uploader: {
          name: info.user?.username,
          url: info.user?.permalink_url
        },
        likes: info.likes_count,
        reposts: info.reposts_count
      },
      options
    );
  }
}

class SoundCloudPlaylist<T> extends Playlist<T> {
  constructor(
    plugin: SoundCloudPlugin,
    info: SoundcloudPlaylistV2,
    options: ResolveOptions<T> = {}
  ) {
    super(
      {
        source: 'soundcloud',
        id: info.id.toString(),
        name: info.title,
        url: info.permalink_url,
        thumbnail: info.artwork_url ?? undefined,
        songs: info.tracks.map((s: any) => new SoundCloudSong(plugin, s, options))
      },
      options
    );
  }
}

export default SoundCloudPlugin;
