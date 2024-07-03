import { EmbedBuilder } from 'discord.js';

export function generateSimpleEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder().setColor('Grey').setDescription(message.slice(0, 2048));
}
