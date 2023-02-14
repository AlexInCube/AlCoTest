import {GuildMember, PermissionResolvable, PermissionsBitField, TextChannel} from "discord.js";

export function CheckBotPermissions (channel: TextChannel, permissionsRequired: Array<PermissionResolvable>): boolean {
    const bot = channel.guild.members.me
    if (!bot) return false
    permissionsRequired.push(PermissionsBitField.Flags.ViewChannel)
    const channelPermissions = bot.permissionsIn(channel)
    return channelPermissions.has(permissionsRequired)
}

export function CheckMemberPermissions (member: GuildMember, permissionsRequired: Array<PermissionResolvable> = []): boolean {
    permissionsRequired.push(PermissionsBitField.Flags.ViewChannel)
    return member.permissions.has(permissionsRequired)
}