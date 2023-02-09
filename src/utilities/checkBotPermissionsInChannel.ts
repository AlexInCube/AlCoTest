import {PermissionResolvable, TextChannel} from "discord.js";

export function CheckBotPermissionsInChannel (channel: TextChannel, permissionsRequired: Array<PermissionResolvable>): boolean {
    const bot = channel.guild.members.me
    if (!bot) return false
    const channelPermissions = bot.permissionsIn(channel)
    return channelPermissions.has(permissionsRequired)
}

