import { BotEvent } from '../DiscordTypes.js';
import { Events, GatewayDispatchEvents } from 'discord.js';
import { AudioPlayerEventRaw } from '../audioplayer/discordEventsHandlers/AudioPlayerEventRaw.js';

const event: BotEvent = {
  name: Events.Raw,
  execute: (client, d) => {
    AudioPlayerEventRaw(client, d);
  }
};

export default event;
