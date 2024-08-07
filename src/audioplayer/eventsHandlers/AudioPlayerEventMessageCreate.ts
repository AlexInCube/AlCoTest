import { TextChannel } from 'discord.js';
import { ENV } from '../../EnvironmentVariables.js';
import { loggerError } from '../../utilities/logger.js';

export async function AudioPlayerEventMessageCreate(textChannel: TextChannel) {
  try {
    const player = textChannel.client.audioPlayer.playersManager.get(textChannel.guild.id);
    if (player) {
      if (player.textChannel.id !== textChannel.id) return;
      await player.recreatePlayer();
    }
  } catch (e) {
    if (ENV.BOT_VERBOSE_LOGGING) loggerError(e);
  }
}
