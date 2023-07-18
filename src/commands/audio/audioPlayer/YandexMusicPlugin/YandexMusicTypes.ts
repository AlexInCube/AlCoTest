import {DisTubeError, OtherSongInfo, PlaylistInfo, Song} from "distube";
import {Album, Track} from "yandex-music-client";

export class YandexMusicTrack implements OtherSongInfo {
    src = "yandexmusic";
    name: string;
    url: string;
    duration: number;
    uploader: string;
    thumbnail: string;

    constructor(info: Track, trackUrl: string) {
        this.name = info.title
        this.duration = info.durationMs / 1000
        this.uploader = info.artists[0].name
        this.url = trackUrl
        this.thumbnail = yandexGetCoverUri(info.coverUri, 100)
    }
}

export class YandexMusicPlaylist implements PlaylistInfo {
    source: "soundcloud";
    songs: Song[];
    id: number;
    name: string;
    url: string;
    thumbnail?: string;
    constructor(info: Album, albumUrl: string) {
        this.source = "soundcloud";
        this.id = info.id;
        this.name = info.title;
        this.url = albumUrl;
        this.thumbnail = yandexGetCoverUri(info.coverUri, 100)
        if (!info.volumes?.length) throw new DisTubeError("YANDEXMUSIC_PLUGIN_EMPTY_PLAYLIST", "Playlist is empty.");
        this.songs = info.volumes[0].map((track) => new Song(new YandexMusicTrack(track, albumUrl)));
    }
}

export type yandexCoverSize = 30 | 50 | 100 | 150 | 200 | 300 | 400 | 700 | 800 | 1000;
/**
 * Returns cover uri with specified size
 *
 * @param uriTemplate track.coverUri
 * @param size cover size
 */
export function yandexGetCoverUri(uriTemplate: string, size: yandexCoverSize) {
    return `https://${uriTemplate.replace('%%', `${size}x${size}`)}`;
}
