import { BotEvent } from '../Types.js';
import { slashCommandHandler } from './interactionHandlers/slashCommandHandler.js';
import { autocompleteHandler } from './interactionHandlers/autocompleteHandler.js';
import { Client, Events, Interaction } from 'discord.js';

const event: BotEvent = {
  name: Events.InteractionCreate,
  execute: async (client: Client, interaction: Interaction) => {
    await slashCommandHandler(interaction);
    await autocompleteHandler(interaction);
  }
};

export default event;
