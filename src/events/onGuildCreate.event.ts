import { BotEvent } from '../DiscordTypes.js';
import {
  Client,
  Guild,
  GuildBasedChannel,
  GuildTextBasedChannel,
  PermissionsBitField
} from 'discord.js';
import { getOrCreateGuildSettings } from '../schemas/SchemaGuild.js';
import { Events } from 'discord.js';
import { CheckBotPermissions } from '../utilities/checkPermissions.js';
import { generateNewGuildEmbed } from '../utilities/generateNewGuildEmbed.js';

const event: BotEvent = {
  name: Events.GuildCreate,
  execute: async (client: Client, guild: Guild) => {
    await getOrCreateGuildSettings(guild.id);

    // Send a welcome message
    const channel: GuildBasedChannel | undefined = guild.channels.cache.find(
      (channel) =>
        // Channel type zero is Text channel
        channel.type === 0 && CheckBotPermissions(channel, [PermissionsBitField.Flags.SendMessages])
    );

    if (!channel) return;
    (channel as GuildTextBasedChannel).send({ embeds: [generateNewGuildEmbed()] });
  }
};

export default event;
