import { BotEvent } from '../Types.js';
import { Client, Events, Message } from 'discord.js';
import { AudioPlayerEventMessageDeleted } from '../audioplayer/eventsHandlers/AudioPlayerEventMessageDeleted.js';

const event: BotEvent = {
  name: Events.MessageDelete,
  execute: async (client: Client, message: Message) => {
    await AudioPlayerEventMessageDeleted(client, message);
  }
};

export default event;
