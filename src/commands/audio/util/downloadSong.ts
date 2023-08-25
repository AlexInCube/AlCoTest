import {AttachmentBuilder, Client} from "discord.js";
import prism from "prism-media";
import fs, {createReadStream, ReadStream} from "fs";
import {pipeline} from 'stream/promises';
import { v4 as uuidv4 } from 'uuid';
import {unlink} from 'fs/promises';
import {isURL} from "distube";
import i18next from "i18next";


fs.rmSync("./downloads", {recursive: true, force: true})
fs.mkdirSync("./downloads")

class DownloadSongError extends Error {
    constructor(message: DownloadSongMessage) {
        super(message);
        this.name = "DownloadSongError";
    }
}

type DownloadSongMessage = "is_not_url" | "not_found" | "song_is_too_large" | "failed_loading"
const maxDownloadSize = 10000000 //bytes

export async function downloadSong(client: Client, request: string): Promise<ReadStream | undefined>{
    let streamUrl = "";

    if (!isURL(request)){
        throw new DownloadSongError("is_not_url")
    }

    for (const plugin of client.audioPlayer.distube.customPlugins) {
        if (await plugin.validate(request)) {
            streamUrl = await plugin.getStreamURL(request);
            break
        }
    }

    for (const plugin of client.audioPlayer.distube.extractorPlugins) {
        if (await plugin.validate(request)) {
            streamUrl = await plugin.getStreamURL(request);
            break
        }
    }

    if (streamUrl === ""){
        throw new DownloadSongError("not_found")
    }

    return await getMP3FileFromDownloadLink(streamUrl)
}

async function getMP3FileFromDownloadLink(downloadLink: string) {
    const response = await fetch(downloadLink)
    const audioSize = parseInt(<string>response.headers.get("Content-Length"))
    if (audioSize > maxDownloadSize) {
        throw new DownloadSongError("song_is_too_large")
    }

    const audioStream: ReadableStream<Uint8Array> | null = response.body

    if (audioStream) return convertWebmToMp3(audioStream)
}

async function convertWebmToMp3(webmStream: ReadableStream<Uint8Array>) {
    const file_name = `./downloads/${uuidv4()}.mp3`
    const file = fs.createWriteStream(file_name)
    const duplex = prism.FFmpeg.from(webmStream)

    await pipeline(duplex, file);
    return createReadStream(file_name)
}

export async function getSongFileAttachment(client: Client, query: string): Promise<AttachmentBuilder>{
    const file = await downloadSong(client, query)
    if (!file) throw new DownloadSongError("failed_loading")
    return new AttachmentBuilder(file)
}

export async function deleteMP3file(fileName: string){
    await unlink(fileName)
}

export function DownloadSongErrorGetLocale(errorMessage: DownloadSongMessage){
    if (errorMessage === "song_is_too_large"){
        return i18next.t(`commands:download_song_error_${errorMessage}`, {maxDownloadSize: maxDownloadSize/1000000})
    }
    return i18next.t(`commands:download_song_error_${errorMessage}`)
}
