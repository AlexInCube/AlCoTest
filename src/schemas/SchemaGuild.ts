import mongoose, { Document, model, Schema } from 'mongoose';
import { ENV } from '../EnvironmentVariables.js';
import {
  deleteGuildSongsHistory,
  SongsHistoryListModelClass
} from './SchemaSongsHistory.js';

interface GuildOptions {
  prefix: string;
  leaveOnEmpty: boolean;
  voiceStatus: boolean;
}

interface ISchemaGuild extends Document {
  guildID: string;
  options: GuildOptions;
  songsHistory: SongsHistoryListModelClass;
}

const SchemaGuild = new Schema<ISchemaGuild>({
  guildID: { type: String, required: true, unique: true },
  options: {
    prefix: { type: String, default: ENV.BOT_COMMAND_PREFIX },
    leaveOnEmpty: { type: Boolean, default: true }
  },
  songsHistory: { type: mongoose.Schema.Types.ObjectId, ref: 'songHistory', required: false }
});

const GuildModel = model<ISchemaGuild>('guild', SchemaGuild);

export class GuildModelClass extends GuildModel {} // This workaround required for better TypeScript support

export async function getOrCreateGuildSettings(guildID: string): Promise<GuildModelClass> {
  const guild = await GuildModelClass.findOne({ guildID });
  if (guild) return guild;
  const newGuild = new GuildModelClass({
    guildID
  });
  await newGuild.save();
  return newGuild;
}

export async function deleteGuildSettings(guildID: string): Promise<void> {
  const guild: GuildModelClass = await getOrCreateGuildSettings(guildID);
  await deleteGuildSongsHistory(guildID);
  await guild?.deleteOne();
}

export async function getGuildOptionPrefix(guildID: string): Promise<string> {
  const guild: GuildModelClass = await getOrCreateGuildSettings(guildID);
  return guild.options.prefix ?? ENV.BOT_COMMAND_PREFIX;
}

export async function setGuildOptionPrefix(guildID: string, prefix: string): Promise<void> {
  const guild: GuildModelClass = await getOrCreateGuildSettings(guildID);
  guild.set({ options: { prefix: prefix } });
  await guild.save();
}

export async function setGuildOptionLeaveOnEmpty(guildID: string, mode: boolean): Promise<void> {
  const guild: GuildModelClass = await getOrCreateGuildSettings(guildID);
  guild.set({ options: { leaveOnEmpty: mode } });
  await guild.save();
}

export async function getGuildOptionLeaveOnEmpty(guildID: string): Promise<boolean> {
  const guild: GuildModelClass = await getOrCreateGuildSettings(guildID);
  return guild.options.leaveOnEmpty ?? true;
}
