import { GuildMember } from 'discord.js';

export function checkMemberInVoice(member: GuildMember) {
  const voice = member.voice.channelId;
  return voice !== null;
}
