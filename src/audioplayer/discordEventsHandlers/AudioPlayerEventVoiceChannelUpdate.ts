import { Client, VoiceState } from 'discord.js';
import { getGuildOptionLeaveOnEmpty } from '../../schemas/SchemaGuild.js';

// TODO: Implement AudioPlayerEventVoiceChannelUpdate
export async function AudioPlayerEventVoiceChannelUpdate(client: Client, oldState: VoiceState, newState: VoiceState) {
  /*
  const messagePlayer = client.audioPlayer.playersManager.get(oldState.guild.id);
  if (!messagePlayer) return;

  if (await getGuildOptionLeaveOnEmpty(oldState.guild.id)) {
    if (isVoiceChannelEmpty(oldState)) {
      await messagePlayer.startAfkTimer();
      await client.audioPlayer.pause(oldState.guild);
    } else if (!isVoiceChannelEmpty(newState) && messagePlayer.getState() === 'pause') {
      await messagePlayer.stopAfkTimer();
      await client.audioPlayer.resume(oldState.guild);
    }
  }

   */
}
