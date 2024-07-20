import { BotEvent } from '../Types.js';
import { Client, Events, TextChannel } from 'discord.js';
import { AudioPlayerEventChannelDelete } from '../audioplayer/eventsHandlers/AudioPlayerEventChannelDelete.js';

const event: BotEvent = {
  name: Events.ChannelDelete,
  execute: async (client: Client, channel: TextChannel) => {
    await AudioPlayerEventChannelDelete(client, channel);
  }
};

export default event;
