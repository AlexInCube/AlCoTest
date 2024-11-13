import { Document, model, Schema } from 'mongoose';
import { getOrCreateGuildSettings, GuildModelClass } from './SchemaGuild.js';
import { ENV } from '../EnvironmentVariables.js';
import { nodeResponse } from 'riffy';

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

export async function addSongToGuildSongsHistory(guildID: string, resource: nodeResponse): Promise<void> {
  const history = await getOrCreateGuildSongsHistory(guildID);

  if (!history) return;

  if (resource.loadType === 'track') {
    if (!resource.tracks[0]) return;
    history.songsHistory.push({
      name: resource.tracks[0].info.title ?? 'unknown',
      requester: resource.tracks[0].info.requester ?? 'unknown',
      url: resource.tracks[0].info.uri
    });
  } else if (resource.loadType === 'playlist') {
    if (!resource.tracks[0]) return;
    history.songsHistory.push({
      name: resource.playlistInfo?.name ?? 'unknown',
      requester: resource.tracks[0].info.requester ?? 'unknown',
      url: resource.tracks[0].info.uri
    });
  }

  if (history.songsHistory.length > ENV.BOT_MAX_SONGS_HISTORY_SIZE) {
    history.songsHistory.shift();
  }

  await history.save();
}
