import { GuildMember, PermissionResolvable, PermissionsBitField, TextChannel } from 'discord.js';

export function CheckBotPermissions(channel: TextChannel, permissionsRequired: Array<PermissionResolvable>): boolean {
  const bot = channel.guild.members.me;
  if (!bot) return false;

  const channelPermissions = bot.permissionsIn(channel);
  return channelPermissions.has([...permissionsRequired, PermissionsBitField.Flags.ViewChannel]);
}

export function CheckMemberPermissions(
  member: GuildMember,
  permissionsRequired: Array<PermissionResolvable> = []
): boolean {
  return member.permissions.has([...permissionsRequired, PermissionsBitField.Flags.ViewChannel]);
}
