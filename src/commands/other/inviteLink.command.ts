import {CommandGroup, ICommand} from "../../CommandTypes";
import {PermissionsBitField, SlashCommandBuilder} from "discord.js";

const command : ICommand = {
    name: "link",
    description: 'Ссылка на приглашение этого бота',
    slash_builder: new SlashCommandBuilder()
        .setName('link')
        .setDescription('Ссылка на приглашение этого бота'),
    group: CommandGroup.Other,
    bot_permissions: [PermissionsBitField.Flags.SendMessages],
    execute: async (interaction) => {
        await interaction.reply({
            content: generateLinkMessage(),
            allowedMentions: { users : []}
        })
    },
    executeText: async (message) => {
        await message.reply({
            content: generateLinkMessage(),
            allowedMentions: { users : []}
        })
    }
}

export function generateLinkMessage(): string{
    return `https://discord.com/api/oauth2/authorize?client_id=${process.env.BOT_DISCORD_CLIENT_ID}&permissions=8&scope=bot%20applications.commands`
}

export default command