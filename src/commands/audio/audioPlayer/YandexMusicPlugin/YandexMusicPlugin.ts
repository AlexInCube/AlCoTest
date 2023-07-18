import {CustomPlugin, DisTubeError, Playlist, PlayOptions, Song} from "distube";
import {Album, Track, YandexMusicClient} from "yandex-music-client";
import {YandexMusicPlaylist, YandexMusicTrack} from "./YandexMusicTypes.js";
import {getTrackUrl} from "yandex-music-client/trackUrl.js";
import {VoiceBasedChannel} from "discord.js";

let yandexClient: YandexMusicClient

export enum SearchType {
    Track = "track",
    Playlist = "album",
}
export interface YandexMusicPluginOptions {
    oauthToken: string;
}
export class YandexMusicPlugin extends CustomPlugin {
    constructor(options: YandexMusicPluginOptions) {
        super();

        if (typeof options !== "object" || Array.isArray(options)) {
            throw new DisTubeError("INVALID_TYPE", ["object", "undefined"], options, "YandexMusicPluginOptions");
        }
        if (options.oauthToken && typeof options.oauthToken !== "string") {
            throw new DisTubeError("INVALID_TYPE", "string", options.oauthToken, "oauthToken");
        }

        yandexClient = new YandexMusicClient({
            BASE: "https://api.music.yandex.net:443",
            HEADERS: {
                'Authorization': `OAuth ${options.oauthToken}`,
                'Accept-Language': 'ru'
            },
        });

    }

    override async validate(url: string): Promise<boolean> {
        return /^https?:\/\/(?:(?:www|music)\.)?yandex\.[a-z0-9]{0,10}\/(.*)$/.test(url)
    }

    async play(voiceChannel: VoiceBasedChannel, songLink: string, options: PlayOptions){
        const opt = {...options, source: "yandexmusic"};
        songLink = songLink.replace(/:\/\/(m|www)\./g, "://");
        const data = parseYandexMusicURL(songLink)
        if (data === undefined) {
            throw new DisTubeError("YANDEXMUSIC_PLUGIN_RESOLVE_ERROR", "Error when parsing URL. Examples of good url: https://music.yandex.ru/album/5605637/track/42445828 or https://music.yandex.ru/album/5605637");
        }

        if (data.type === SearchType.Track) {
            const downloadTrackUri = await getTrackUrl(yandexClient, data.id)
            const trackData = await yandexGetTrack(data.id)
            if (!downloadTrackUri || !trackData) {
                throw new DisTubeError("SOUNDCLOUD_PLUGIN_RESOLVE_ERROR", "Track data is not found");
            }

            const finalSong = new Song(new YandexMusicTrack(trackData, songLink))
            finalSong.source = "yandexmusic"
            finalSong.streamURL = downloadTrackUri
            finalSong.url = songLink
            await this.distube.play(voiceChannel, finalSong, opt)
        } else if (data.type === SearchType.Playlist){
            const playlistData: Album = await yandexClient.albums.getAlbumsWithTracks(Number(data.id)).then(r => {
                return r.result
            })
            if (!playlistData.volumes?.length) {
                throw new DisTubeError("YANDEXMUSIC_PLUGIN_RESOLVE_ERROR", "Playlist is empty")
            }
            const playlistTracks: Track[] = playlistData.volumes[0]

            const results: string[] = await Promise.all(playlistTracks.map(async query => await getTrackUrl(yandexClient, query.id)));
            const finalPlaylist = new Playlist(new YandexMusicPlaylist(playlistData, songLink))
            finalPlaylist.songs = finalPlaylist.songs.map((song, index) => {
                song.source = "yandexmusic"
                song.url = generateTrackUrl(data.id, playlistTracks[index].id)
                song.streamURL = results[index]
                return song
            })

            await this.distube.play(voiceChannel, finalPlaylist, options)
        }
    }
}

function parseYandexMusicURL(url: string): {type: SearchType, id: string, url: string} | undefined {
    // for example https://music.yandex.com/album/10030/track/38634572


    try{
        let parsedData = new URL(url).pathname.split("/").splice(1)
        parsedData = parsedData.filter((element) => {
            return (element === SearchType.Track || element === SearchType.Playlist || typeof parseInt(element) === "number") && element !== ""
        })

        const type = parsedData[parsedData.length - 2]

        switch (parsedData.length) {
            case 4: {
                if (type !== SearchType.Track) {
                    return undefined
                }
                const id = parsedData[3]
                if (typeof parseInt(id) !== "number") {
                    return undefined
                }
                return {type: SearchType.Track, id, url}
            }
            case 2: {
                if (type !== SearchType.Playlist){
                    return undefined
                }
                const id = parsedData[1]
                if (typeof parseInt(id) !== "number") {
                    return undefined
                }
                return {type: SearchType.Playlist, id, url}
            }
        }
    } catch (e) {
        return undefined
    }
}

async function yandexGetTrack(trackId: string): Promise<Track | undefined> {
    return await yandexClient.tracks.getTracks({"track-ids": [trackId], "with-positions": false}).then(response => {
        return response.result[0]
    }).catch(() => {
        return undefined
    })
}

function generateTrackUrl(albumId: string, trackUrl: string): string{
    return `https://music.yandex.com/album/${albumId}/track/${trackUrl}`
}

