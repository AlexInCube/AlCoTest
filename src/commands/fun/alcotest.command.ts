import {ICommand} from "../../CommandTypes.js";
import {Message, PermissionsBitField, SlashCommandBuilder} from "discord.js";
import {GroupFun} from "./FunTypes.js";
import i18next from "i18next";

export default function(): ICommand {
    return {
        text_data: {
            name: "alcotest",
            description: i18next.t("commands:alcotest_desc"),
            execute: async (message: Message) => {
                await message.reply({
                    content: generateAlcoTestMessage(),
                    allowedMentions: { users : []}
                })
            }
        },
        slash_data: {
            slash_builder: new SlashCommandBuilder()
                .setName('alcotest')
                .setDescription(i18next.t("commands:alcotest_desc")),
            execute: async (interaction) => {
                await interaction.reply({
                    content: generateAlcoTestMessage(),
                    allowedMentions: { users : []}
                })
            },
        },
        group: GroupFun,
        bot_permissions: [PermissionsBitField.Flags.SendMessages],
    }
}

function generateAlcoTestMessage(): string{
    return `🍻 ${i18next.t("commands:alcotest_success")} ${Math.round(Math.random() * 100)}% 🍻 `
}

