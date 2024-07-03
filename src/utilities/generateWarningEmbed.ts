import { EmbedBuilder } from 'discord.js';
import i18next from 'i18next';

export function generateWarningEmbed(warningMessage: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(`<:warning:1257892727014817865> ${i18next.t('general:warning')}`)
    .setColor('Yellow')
    .setDescription(warningMessage.slice(0, 2048));
}
