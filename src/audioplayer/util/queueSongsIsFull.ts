import { Client, Guild } from 'discord.js';
import { ENV } from '../../EnvironmentVariables.js';

export function queueSongsIsFull(client: Client, guild: Guild): boolean {
  const queue = client.audioPlayer.distube.getQueue(guild);

  if (!queue) return false;

  return queue.songs.length >= ENV.BOT_MAX_SONGS_IN_QUEUE;
}
