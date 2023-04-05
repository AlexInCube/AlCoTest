import {SearchResultType, Song} from "distube";
import {client} from "../../../main";
import * as fs from "fs";
import ytdl from "@distube/ytdl-core";

export class DownloadsManager {

    private downloadPath = `${__dirname}/download`
    private songsPath = `${this.downloadPath}/songs`
    constructor() {
        fs.unlinkSync(this.songsPath)
        fs.mkdirSync(this.songsPath)

    }
    async searchSong (request: string) {
        await client.audioPlayer.distube.search(request, {limit: 1, type: SearchResultType.VIDEO}).then(function (result) {
            return result[0]
        })
    }

    deleteSongFile(filename: string) {
        fs.unlink(filename, err => { if (err) throw err })
    }

    async downloadSong (song: Song) {
        if (song.isLive) {
            return 'songIsLive'
        }

        const fileName = `${this.songsPath}/${song?.name?.replaceAll(/[&/\\#,+()$~%.'":*?<>|{}]/g, '')}.mp3`
        
        let stream

        try{
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            stream = ytdl(song.url, { filter: 'audioonly', format: "mp3", quality: 'lowestaudio' })
        } catch (e) {
            return `failedToStream`
        }

        try{
            stream.pipe(fs.createWriteStream(fileName)).on('finish', async () => {
                try {
                    const stats = fs.statSync(fileName)
                    if (stats.size >= 8388608) {
                        this.deleteSongFile(fileName)
                        return 'songIsTooLarge'
                    } else {
                        return fileName
                    }
                } catch (e) {
                    this.deleteSongFile(fileName)
                    return 'undefinedError'
                }
            })
        } catch (e) {
            return 'undefinedError'
        }
    }
}