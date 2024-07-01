import { Client, VoiceState } from 'discord.js';
import { isVoiceChannelEmpty } from 'distube';

export async function AudioPlayerEventVoiceChannelUpdate(client: Client, oldState: VoiceState, newState: VoiceState) {
  const messagePlayer = client.audioPlayer.playersManager.get(oldState.guild.id);
  if (!messagePlayer) return;

  if (isVoiceChannelEmpty(oldState)) {
    await client.audioPlayer.pause(oldState.guild);
  } else if (!isVoiceChannelEmpty(newState) && messagePlayer.getState() === "pause") {
    await client.audioPlayer.resume(oldState.guild);
  }
}
