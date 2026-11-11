import { Guild } from 'discord.js';
import { DisTubeVoice } from 'distube';

export function checkBotInVoice(guild: Guild): DisTubeVoice | undefined {
  return guild.client.audioPlayer.distube.voices.get(guild.id);
}
