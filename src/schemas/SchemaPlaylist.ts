import { Document, model, Schema } from 'mongoose';
import { ENV } from '../EnvironmentVariables.js';
import { getOrCreateUser } from './SchemaUser.js';
import { ApplicationCommandOptionChoiceData, AutocompleteInteraction } from 'discord.js';
import { getSongsNoun } from '../audioplayer/util/getSongsNoun.js';
import { Track } from 'riffy';

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
  songsSize: number;
  createdAt: Date;
  updatedAt: Date;
}

export const PlaylistNameMinLength = 1;
export const PlaylistNameMaxLength = 50;

export const SchemaPlaylist = new Schema<ISchemaPlaylist>(
  {
    name: { type: String, required: true, maxlength: PlaylistNameMaxLength, minlength: PlaylistNameMinLength },
    songs: { type: [SchemaSongPlaylistUnit], default: [], select: false },
    songsSize: { type: Number, default: 0 }
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: true
    }
  }
);

SchemaPlaylist.pre('save', function (next) {
  this.songsSize = this.songs.length;
  next();
});

const PlaylistModel = model<ISchemaPlaylist>('playlist', SchemaPlaylist);

export class PlaylistModelClass extends PlaylistModel {} // This workaround required for better TypeScript support

export class PlaylistAlreadyExists extends Error {
  constructor(playlistName: string) {
    super();
    this.name = 'PlaylistAlreadyExistsError';
    this.message = `Playlist with name ${playlistName} already exists`;
  }
}

export class PlaylistIsNotExists extends Error {
  constructor(playlistName: string) {
    super();
    this.name = 'PlaylistIsNotExistsError';
    this.message = `Playlist with name ${playlistName} is not exists`;
  }
}

export class PlaylistMaxSongsLimit extends Error {
  constructor(playlistName: string) {
    super();
    this.name = 'PlaylistSongsLimitExistsError';
    this.message = `You cant add more songs to playlist ${playlistName}, max songs limit is ${ENV.BOT_MAX_SONGS_IN_USER_PLAYLIST}`;
  }
}

export class PlaylistMaxPlaylistsCount extends Error {
  constructor() {
    super();
    this.name = 'PlaylistMaxPlaylistsCountError';
    this.message = `You cant create more playlists, max playlists count for user is ${ENV.BOT_MAX_PLAYLISTS_PER_USER}`;
  }
}

export class PlaylistSongIsNotValid extends Error {
  constructor() {
    super();
    this.name = 'PlaylistSongIsNotValid';
    this.message = 'Cannot validate song url in any service';
  }
}

export class PlaylistSongNotExists extends Error {
  constructor(playlistName: string, songID: number) {
    super();
    this.name = 'PlaylistSongNotExists';
    this.message = `Song with id ${songID} not exists in playlist ${playlistName}`;
  }
}
/*
export class PlaylistSongAlreadyInPlaylist extends Error {
  constructor(playlistName: string, songName: string) {
    super();
    this.name = 'PlaylistSongAlreadyInPlaylist';
    this.message = `Song ${songName} already in playlist ${playlistName}`;
  }
}
*/

export async function UserPlaylistCreate(userID: string, name: string, bypassPlaylistsLimit = false): Promise<void> {
  let playlist;

  try {
    playlist = await UserPlaylistGet(userID, name);
  } catch (e) {
    if (!(e instanceof PlaylistIsNotExists)) {
      throw e;
    }
  }

  if (playlist) throw new PlaylistAlreadyExists(name);

  const user = await getOrCreateUser(userID);

  if (!user.playlists) {
    user.playlists = [];
  }

  if (!bypassPlaylistsLimit) {
    if (user.playlists.length >= ENV.BOT_MAX_PLAYLISTS_PER_USER) {
      throw new PlaylistMaxPlaylistsCount();
    }
  }

  const newPlaylist = new PlaylistModelClass({
    name: name,
    songs: []
  });

  await newPlaylist.save();

  user.playlists.push(newPlaylist);

  await user.save();
}

export async function UserPlaylistGet(
  userID: string,
  name: string,
  withSongs: boolean = false
): Promise<PlaylistModelClass> {
  const user = await getOrCreateUser(userID);
  const userWithPlaylists = await user.populate({
    path: 'playlists',
    select: withSongs ? ['name', 'songs', 'createdAt', 'updatedAt', 'songsSize'] : undefined
  });

  if (!userWithPlaylists.playlists) throw new PlaylistIsNotExists(name);

  const playlist = userWithPlaylists.playlists.find((playlist) => playlist.name === name);
  if (!playlist) throw new PlaylistIsNotExists(name);
  return playlist;
}

export async function UserPlaylistGetPlaylists(userID: string): Promise<Array<PlaylistModelClass> | null> {
  const user = await (await getOrCreateUser(userID)).populate('playlists');

  if (!user.playlists) return null;
  return user.playlists;
}

export async function UserPlaylistDelete(userID: string, name: string): Promise<void> {
  const user = await (await getOrCreateUser(userID)).populate('playlists');
  const playlist = await UserPlaylistGet(userID, name);

  if (!playlist || !user.playlists) throw new PlaylistIsNotExists(name);

  await playlist.deleteOne({ name });

  user.playlists = user.playlists.filter((playlist) => playlist.name !== name);

  await user.save();
}

export async function UserPlaylistAddSong(userID: string, name: string, track: Track): Promise<void> {
  const playlist = await UserPlaylistGet(userID, name, true);
  if (!playlist) throw new PlaylistIsNotExists(name);

  if (playlist.songs.length > ENV.BOT_MAX_SONGS_IN_USER_PLAYLIST) {
    throw new PlaylistMaxSongsLimit(name);
  }

  playlist.songs.push({ name: track.info.title, url: track.info.uri });

  await playlist.save();
}

export async function UserPlaylistRemoveSong(
  userID: string,
  name: string,
  index: number
): Promise<ISchemaSongPlaylistUnit> {
  const playlist = await UserPlaylistGet(userID, name, true);
  if (!playlist) throw new PlaylistIsNotExists(name);

  const song = playlist.songs[index];
  if (!song) throw new PlaylistSongNotExists(name, index);
  playlist.songs.splice(index, 1);

  await playlist.save();
  return song;
}

export async function UserPlaylistNamesAutocomplete(interaction: AutocompleteInteraction) {
  // const focusedValue = interaction.options.getFocused(true);

  const playlists = await UserPlaylistGetPlaylists(interaction.user.id);
  let finalResult: Array<ApplicationCommandOptionChoiceData> = [];

  if (playlists) {
    finalResult = playlists?.map((playlist) => {
      return {
        name: `${playlist.name} - ${playlist.songsSize} ${getSongsNoun(playlist.songsSize)}`,
        value: playlist.name
      };
    });
  }

  await interaction.respond(finalResult);
}

export async function UserPlaylistAddFavoriteSong(userID: string, track: Track): Promise<void> {
  try {
    await UserPlaylistAddSong(userID, 'favorite-songs', track);
  } catch (e) {
    if (e instanceof PlaylistIsNotExists) {
      await UserPlaylistCreate(userID, 'favorite-songs', true);

      await UserPlaylistAddSong(userID, 'favorite-songs', track);

      return;
    }

    throw e;
  }
}
