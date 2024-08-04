import { Document, model, Schema } from 'mongoose';
import { Guild } from 'discord.js';
import { ENV } from '../EnvironmentVariables.js';

interface GuildOptions {
  prefix: string;
}

interface IGuild extends Document {
  guildID: string;
  options: GuildOptions;
}

const GuildSchema = new Schema<IGuild>({
  guildID: { type: String, required: true },
  options: {
    prefix: { type: String, default: ENV.BOT_COMMAND_PREFIX }
  }
});

GuildSchema.set('collection', 'guilds');

const GuildModel = model<IGuild>('guild', GuildSchema);

export async function setupGuildSettings(guild: Guild): Promise<IGuild> {
  const newGuild = new GuildModel({
    guildID: guild.id
  });
  return await newGuild.save();
}

export async function deleteGuildSettings(guild: Guild): Promise<void> {
  const foundGuild: IGuild | null = await GuildModel.findOne({ guildID: guild.id });
  await foundGuild?.deleteOne();
}

export async function getGuildPrefix(guild: Guild): Promise<string | undefined> {
  const foundGuild: IGuild | null = await GuildModel.findOne({ guildID: guild.id });
  if (!foundGuild) return undefined;
  return foundGuild.options.prefix;
}

export async function setGuildPrefix(guild: Guild, prefix: string): Promise<void> {
  let foundGuild: IGuild | null = await GuildModel.findOne({ guildID: guild.id });
  if (!foundGuild) foundGuild = await setupGuildSettings(guild);
  await foundGuild.updateOne({ options: { prefix: prefix } });
}
