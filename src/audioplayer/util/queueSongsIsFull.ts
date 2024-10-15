import { Client, Guild } from 'discord.js';
import { ENV } from '../../EnvironmentVariables.js';

export function queueSongsIsFull(client: Client, guild: Guild): boolean {
  try {
    const riffyPlayer = client.audioPlayer.riffy.get(guild.id);

    return riffyPlayer.queue.length >= ENV.BOT_MAX_SONGS_IN_QUEUE;
  } catch {
    return false;
  }
}
