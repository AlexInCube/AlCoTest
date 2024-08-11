import { model, Schema } from 'mongoose';
import { getOrCreateGuildSettings, GuildModelClass } from './SchemaGuild.js';
import { Playlist, Song } from 'distube';

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

export interface ISchemaSongsHistory {
  songsHistory: Array<ISchemaSongHistoryUnit>;
}

export const SchemaSongsHistoryList = new Schema<ISchemaSongsHistory>(
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

const SongsHistoryListModel = model<ISchemaSongsHistory>('songHistory', SchemaSongsHistoryList);

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
  await guild.songsHistory.deleteOne();
}

export async function addSongToGuildSongsHistory(
  guildID: string,
  resource: Song | Playlist
): Promise<void> {
  const history = await getOrCreateGuildSongsHistory(guildID);

  if (!history) return;

  if (resource.name && resource.member?.id && resource.url) {
    history.songsHistory.push({
      name: resource.name ?? 'unknown',
      requester: resource.member?.id ?? 'unknown',
      url: resource.url
    });
  }

  if (history.songsHistory.length > 15) {
    history.songsHistory.shift();
  }

  await history.save();
}
