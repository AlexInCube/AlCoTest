import { Client, TextChannel } from 'discord.js';

export async function AudioPlayerEventChannelDelete(client: Client, channel: TextChannel) {
  const player = client.audioPlayer.playersManager.get(channel.guild.id);
  if (player?.textChannel.id === channel.id) {
    await client.audioPlayer.stop(channel.guild.id);
  }
}
