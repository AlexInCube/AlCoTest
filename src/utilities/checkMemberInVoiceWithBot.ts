import { GuildMember } from 'discord.js';

export function checkMemberInVoiceWithBot(member: GuildMember): boolean {
  const memberChannel = member.voice.channelId;
  const clientChannel = member.guild.members.me?.voice.channelId;

  if (!memberChannel || !clientChannel) {
    return false;
  }

  return memberChannel === clientChannel;
}
