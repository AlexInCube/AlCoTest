import { EmbedBuilder } from 'discord.js';
import i18next from 'i18next';

export function generateErrorEmbed(errorMessage: string, errorName = i18next.t('general:error')): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(`<:error:1257892426790731786> ${errorName}`)
    .setColor('Red')
    .setDescription(errorMessage.slice(0, 2048));
}
