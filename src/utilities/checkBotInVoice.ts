import { Guild } from 'discord.js';

export function checkBotInVoice(guild: Guild): boolean {
  return !!guild.members.me?.voice.channelId;
}
