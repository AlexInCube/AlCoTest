import { Colors, EmbedBuilder } from 'discord.js';
import { ENV } from '../EnvironmentVariables.js';
import i18next from 'i18next';

export function generateNewGuildEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(i18next.t('welcomeMessage:title'))
    .setDescription(
      i18next.t('welcomeMessage:row_1') +
        '\n\n' +
        i18next.t('welcomeMessage:row_2') +
        '\n\n' +
        i18next.t('welcomeMessage:row_3', {
          prefix: ENV.BOT_COMMAND_PREFIX,
          interpolation: { escapeValue: false }
        }) +
        '\n\n' +
        i18next.t('welcomeMessage:row_4')
    )
    .setColor(Colors.Yellow)
    .setImage(
      'https://github.com/AlexInCube/AlCoTest/blob/master/icons/repository-social.png?raw=true'
    );
}
