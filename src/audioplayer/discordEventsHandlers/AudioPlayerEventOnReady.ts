import { Client } from 'discord.js';

export async function AudioPlayerEventOnReady(client: Client) {
  if (!client.user) return;

  client.audioPlayer.riffy.init(client.user.id);
}
