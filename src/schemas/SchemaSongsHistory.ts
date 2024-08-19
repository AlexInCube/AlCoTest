import { Document, model, Schema } from 'mongoose';
import { getOrCreateGuildSettings, GuildModelClass } from './SchemaGuild.js';
import { Playlist, Song } from 'distube';
import { ENV } from '../EnvironmentVariables.js';

interface ISchemaSongHistoryUnit {
  name: string;
  requester: string;
  url: string;
  createdAt?: Date;
}

const SchemaSongsHistoryUnit = new Schema<ISchemaSongHistoryUnit>(
  {
    name: { type: String, required: true },
    requester: { type: String, required: true },
    url: { type: String, required: true }
  },
  {
    timestamps: {
      createdAt: true
    }
  }
);

export interface ISchemaSongsHistory extends Document {
  songsHistory: Array<ISchemaSongHistoryUnit>;
}

export const SchemaSongsHistory = new Schema<ISchemaSongsHistory>(
  {
    songsHistory: { type: [SchemaSongsHistoryUnit], default: [] }
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: true
    }
  }
);

const SongsHistoryListModel = model<ISchemaSongsHistory>('songHistory', SchemaSongsHistory);

export class SongsHistoryListModelClass extends SongsHistoryListModel {} // This workaround required for better TypeScript support

export async function getOrCreateGuildSongsHistory(guildID: string) {
  const guild: GuildModelClass = await getOrCreateGuildSettings(guildID);
  if (guild.songsHistory) return SongsHistoryListModel.findOne({ _id: guild.songsHistory });
  const newHistory = new SongsHistoryListModelClass();
  await newHistory.save();

  guild.set({ songsHistory: newHistory._id });
  await guild.save();
  return newHistory;
}

export async function deleteGuildSongsHistory(guildID: string) {
  const guild: GuildModelClass = await getOrCreateGuildSettings(guildID);
  await SongsHistoryListModelClass.deleteOne({ _id: guild.songsHistory });
}

export async function addSongToGuildSongsHistory(guildID: string, resource: Song | Playlist): Promise<void> {
  const history = await getOrCreateGuildSongsHistory(guildID);

  if (!history) return;

  // Users' playlists cannot be added to history, because they don't have url
  if (resource.name && resource.member?.id && resource.url) {
    history.songsHistory.push({
      name: resource.name ?? 'unknown',
      requester: resource.member?.id ?? 'unknown',
      url: resource.url
    });
  }

  if (history.songsHistory.length > ENV.BOT_MAX_SONGS_HISTORY_SIZE) {
    history.songsHistory.shift();
  }

  await history.save();
}
