// TODO: Reimplement song downloading
/*
import { AttachmentBuilder, Client } from 'discord.js';
import prism from 'prism-media';
import fs, { createReadStream, ReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import { v4 as uuidv4 } from 'uuid';
import { unlink } from 'fs/promises';
import i18next from 'i18next';
import path from 'path';

const downloadFolderPath = process.cwd() + '/downloads';

if (fs.existsSync(downloadFolderPath)) {
  fs.readdir(downloadFolderPath, (err, files) => {
    if (err) throw err;

    for (const file of files) {
      fs.unlink(path.join(downloadFolderPath, file), (err) => {
        if (err) throw err;
      });
    }
  });
} else {
  fs.mkdirSync(downloadFolderPath);
}

class DownloadSongError extends Error {
  constructor(message: DownloadSongMessage) {
    super(message);
    this.name = 'DownloadSongError';
  }
}

type DownloadSongMessage = 'is_not_url' | 'not_found' | 'song_is_too_large' | 'failed_loading' | 'this_is_playlist';

const maxDownloadSize = 2.5e7; //bytes
const maxDownloadSizeMB = maxDownloadSize / 1000000;

export async function downloadSong(client: Client, request: string): Promise<ReadStream | undefined> {
  let streamUrl: string | undefined = '';

  if (!isURL(request)) {
    throw new DownloadSongError('is_not_url');
  }

  const song: Song | Playlist = await client.audioPlayer.distube.handler.resolve(request);
  if (song instanceof Playlist) {
    throw new DownloadSongError('this_is_playlist');
  }

  await client.audioPlayer.distube.handler.attachStreamInfo(song);

  // @ts-expect-error Url property exists, I know it
  streamUrl = song.stream.playFromSource ? song.stream.url : song.stream.song?.stream.url;

  if (streamUrl === '' || streamUrl === undefined) {
    throw new DownloadSongError('not_found');
  }

  return await getMP3FileFromDownloadLink(streamUrl);
}

async function getMP3FileFromDownloadLink(downloadLink: string) {
  const response = await fetch(downloadLink);
  const audioSize = parseInt(<string>response.headers.get('Content-Length'));
  if (audioSize > maxDownloadSize) {
    throw new DownloadSongError('song_is_too_large');
  }

  const audioStream: ReadableStream<Uint8Array> | null = response.body;

  if (audioStream) return convertWebmToMp3(audioStream);
}

async function convertWebmToMp3(webmStream: ReadableStream<Uint8Array>) {
  const file_name = `./downloads/${uuidv4()}.mp3`;
  const file = fs.createWriteStream(file_name);
  const duplex = prism.FFmpeg.from(webmStream);

  // Duplex can be provided to pipeline function
  await pipeline(duplex, file);
  return createReadStream(file_name);
}

export async function getSongFileAttachment(client: Client, query: string): Promise<AttachmentBuilder> {
  const file = await downloadSong(client, query);
  if (!file) throw new DownloadSongError('failed_loading');
  return new AttachmentBuilder(file);
}

export async function deleteMP3file(fileName: string) {
  await unlink(fileName);
}

export function DownloadSongErrorGetLocale(errorMessage: DownloadSongMessage) {
  if (errorMessage === 'song_is_too_large') {
    return i18next.t(`commands:download_song_error_${errorMessage}`, {
      maxDownloadSize: maxDownloadSizeMB
    });
  }

  const localeToken = `commands:download_song_error_${errorMessage}`;
  const locale = i18next.t(localeToken);

  if (localeToken !== locale) {
    return locale;
  }

  return errorMessage;
}
*/
