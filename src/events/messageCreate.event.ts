import { BotEvent } from '../Types.js';
import { Client, Events, Message, TextChannel } from 'discord.js';
import { textCommandsHandler } from './messageHandlers/textCommandsHandler.js';
import {
  AudioPlayerEventMessageCreate
} from '../audioplayer/eventsHandlers/AudioPlayerEventMessageCreate.js';

const event: BotEvent = {
  name: Events.MessageCreate,
  execute: async function (client: Client, message: Message) {
    await textCommandsHandler(client, message);

    if (!message.guild) return;
    await AudioPlayerEventMessageCreate(message.channel as TextChannel);
  }
};

export default event;
