import { BotEvent } from '../Types';
import { Client, Events, VoiceState } from 'discord.js';
import {
  AudioPlayerEventVoiceChannelUpdate
} from '../audioplayer/eventsHandlers/AudioPlayerEventVoiceChannelUpdate.js';

export const event: BotEvent = {
  name: Events.VoiceStateUpdate,
  execute: async (client: Client, oldState: VoiceState, newState: VoiceState) => {
    //ENV.NODE_ENV === 'production' ? 120 : 5
    await AudioPlayerEventVoiceChannelUpdate(client, oldState, newState)
  }
};

export default event;
