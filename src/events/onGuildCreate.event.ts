import { BotEvent } from '../Types.js';
import { Client, Guild } from 'discord.js';
import { setupSettings } from '../handlers/MongoSchemas/SchemaGuild.js';
import { Events } from 'discord.js';

const event: BotEvent = {
  name: Events.GuildCreate,
  execute: async (client: Client, guild: Guild) => {
    await setupSettings(guild);
  }
};

export default event;
