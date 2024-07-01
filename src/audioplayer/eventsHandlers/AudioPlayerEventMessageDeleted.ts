import { Client, Message, TextChannel } from 'discord.js';
import { ENV } from '../../EnvironmentVariables.js';
import { loggerError } from '../../utilities/logger.js';

export async function AudioPlayerEventMessageDeleted(client: Client, message: Message){
  if (!message.guild) return;

  const textChannel = message.channel as TextChannel;
  const player = client.audioPlayer.playersManager.get(textChannel.guild.id);
  if (player) {
    if (player.textChannel.id !== textChannel.id) return;
    if (player.lastDeletedMessage?.id === message.id) return; // If player deleted message them self, then don`t "trigger" event
    try {
      await player.recreatePlayer();
    } catch (e) {
      if (ENV.BOT_VERBOSE_LOGGING) loggerError(e);
    }
  }
}
