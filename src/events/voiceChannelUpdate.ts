import { BotEvent } from '../Types';
import { Client, Events, VoiceState } from 'discord.js';
import { isVoiceChannelEmpty } from 'distube';

export const event: BotEvent = {
  name: Events.VoiceStateUpdate,
  execute: (client: Client, oldState: VoiceState) => {
    if (!oldState?.channel) return;
    //ENV.NODE_ENV === 'production' ? 120 : 5
    const queue = client.distube.queues.get(oldState);
    if (!queue) return;
    if (isVoiceChannelEmpty(oldState)) {
      queue.pause();
    } else if (queue.paused) {
      queue.resume();
    }
  }
};

export default event;
