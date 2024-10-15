import { BotEvent } from '../DiscordTypes.js';
import { Events, GatewayDispatchEvents } from 'discord.js';
import { AudioPlayerEventRaw } from '../audioplayer/eventsHandlers/AudioPlayerEventRaw.js';

const event: BotEvent = {
  name: Events.Raw,
  execute: (client, d) => {
    AudioPlayerEventRaw(client, d);
  }
};

export default event;
