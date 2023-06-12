import {ICommand} from "../../CommandTypes.js";
import {Message, PermissionsBitField, SlashCommandBuilder} from "discord.js";
import {GroupInfo} from "./InfoTypes.js";
import i18next from "i18next";

export default function(): ICommand {
    return {
        text_data: {
            name: "invite",
            description: i18next.t("commands:invite_desc"),
            execute: async (message: Message) => {
                await message.reply({
                    content: generateLinkMessage(),
                    allowedMentions: { users : []}
                })
            }
        },
        slash_data: {
            slash_builder: new SlashCommandBuilder()
                .setName('invite')
                .setDescription(i18next.t("commands:invite_desc")),
            execute: async (interaction) => {
                await interaction.reply({
                    content: generateLinkMessage(),
                    allowedMentions: { users : []}
                })
            },
        },
        group: GroupInfo,
        bot_permissions: [PermissionsBitField.Flags.SendMessages],
    }
}

export function generateLinkMessage(): string{
    return `https://discord.com/api/oauth2/authorize?client_id=${process.env.BOT_DISCORD_CLIENT_ID}&permissions=8&scope=bot%20applications.commands`
}
