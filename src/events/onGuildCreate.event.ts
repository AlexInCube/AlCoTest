import { BotEvent } from '../DiscordTypes.js';
import { Client, Guild } from 'discord.js';
import { setupGuildSettings } from '../schemas/SchemaGuild.js';
import { Events } from 'discord.js';

const event: BotEvent = {
  name: Events.GuildCreate,
  execute: async (client: Client, guild: Guild) => {
    await setupGuildSettings(guild);
  }
};

export default event;
