import { BotEvent } from '../DiscordTypes.js';
import { Client, Guild } from 'discord.js';
import { deleteGuildSettings } from '../schemas/SchemaGuild.js';
import { Events } from 'discord.js';

const event: BotEvent = {
  name: Events.GuildDelete,
  execute: async (client: Client, guild: Guild) => {
    await deleteGuildSettings(guild.id);
  }
};

export default event;
