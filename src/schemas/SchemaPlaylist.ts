import { Document, model, Schema } from 'mongoose';
import { Song } from 'distube';
import { ENV } from '../EnvironmentVariables.js';
import { getOrCreateUser } from './SchemaUser.js';

interface ISchemaSongPlaylistUnit {
  name: string;
  url: string;
  createdAt?: Date;
}

const SchemaSongPlaylistUnit = new Schema<ISchemaSongPlaylistUnit>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true, unique: true, sparse: true }
  },
  {
    timestamps: {
      createdAt: true
    }
  }
);

export interface ISchemaPlaylist extends Document {
  name: string;
  songs: Array<ISchemaSongPlaylistUnit>;
}

export const PlaylistNameMinLength = 1;
export const PlaylistNameMaxLength = 50;

export const SchemaPlaylist = new Schema<ISchemaPlaylist>(
  {
    name: { type: String, required: true, maxlength: PlaylistNameMaxLength, minlength: PlaylistNameMinLength },
    songs: { type: [SchemaSongPlaylistUnit], default: [] }
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: true
    }
  }
);

const PlaylistModel = model<ISchemaPlaylist>('playlist', SchemaPlaylist);

export class PlaylistModelClass extends PlaylistModel {} // This workaround required for better TypeScript support

export class PlaylistAlreadyExists extends Error {
  constructor() {
    super();
    this.name = 'PlaylistAlreadyExistsError';
  }
}

export class PlaylistIsNotExists extends Error {
  constructor() {
    super();
    this.name = 'PlaylistIsNotExistsError';
  }
}

export class PlaylistSongsLimitExists extends Error {
  constructor() {
    super();
    this.name = 'PlaylistSongsLimitExistsError';
  }
}

export class PlaylistMaxPlaylistsCount extends Error {
  constructor() {
    super();
    this.name = 'PlaylistMaxPlaylistsCountError';
  }
}

export async function UserPlaylistCreate(userID: string, name: string): Promise<void> {
  const playlist = await UserPlaylistGet(userID, name);
  if (playlist) throw new PlaylistAlreadyExists();
  const user = await getOrCreateUser(userID);

  if (!user.playlists) {
    user.playlists = [];
  }

  if (user.playlists.length >= ENV.BOT_MAX_PLAYLISTS_PER_USER) {
    throw new PlaylistMaxPlaylistsCount();
  }

  const newPlaylist = new PlaylistModelClass({
    name: name,
    songs: []
  });

  await newPlaylist.save();

  user.playlists.push(newPlaylist);

  await user.save();
}

export async function UserPlaylistGet(userID: string, name: string): Promise<PlaylistModelClass | null | undefined> {
  const user = await (await getOrCreateUser(userID)).populate('playlists');

  if (!user.playlists) return null;
  return user.playlists.find((playlist) => playlist.name === name);
}

export async function UserPlaylistGetPlaylists(userID: string): Promise<Array<PlaylistModelClass> | null> {
  const user = await (await getOrCreateUser(userID)).populate('playlists');

  if (!user.playlists) return null;
  return user.playlists;
}

export async function UserPlaylistDelete(userID: string, name: string): Promise<void> {
  const playlist = await UserPlaylistGet(userID, name);
  playlist?.deleteOne();
}

export async function UserPlaylistAddSong(userID: string, name: string, song: Song): Promise<void> {
  const playlist = await UserPlaylistGet(userID, name);
  if (!playlist) throw new Error(`Playlist is not exists: ${playlist}`);

  if (playlist.songs.length > ENV.BOT_MAX_SONGS_IN_USER_PLAYLIST) {
    throw new Error(`Playlists can contain only ${ENV.BOT_MAX_SONGS_IN_USER_PLAYLIST}`);
  }

  playlist.songs.push({ name: song.name!, url: song.url! });

  await playlist.save();
}

export async function UserPlaylistRemoveSong(userID: string, name: string, index: number): Promise<void> {
  const playlist = await UserPlaylistGet(userID, name);
  if (!playlist) throw new Error(`Playlist is not exists: ${playlist}`);

  playlist.songs.splice(index, 1);

  await playlist.save();
}
