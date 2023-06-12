import {ICommand} from "../../CommandTypes.js";
import {
    ActionRowBuilder, ChatInputCommandInteraction, Message, ModalActionRowComponentBuilder,
    ModalBuilder,
    PermissionsBitField,
    SlashCommandBuilder,
    TextInputBuilder,
    TextInputStyle
} from "discord.js";
import {GroupInfo} from "./InfoTypes.js";
import i18next from "i18next";

export default function(): ICommand {
    return {
        text_data: {
            name: "report",
            description: i18next.t("commands:report_desc"),
            execute: async (message: Message) => {
                await message.reply(i18next.t("commands:report_text_error") as string)
            }
        },
        slash_data: {
            slash_builder: new SlashCommandBuilder()
                .setName('report')
                .setDescription(i18next.t("commands:report_desc")),
            execute: async (interaction: ChatInputCommandInteraction) => {
                await interaction.showModal(generateModalWindow())
            },
        },
        group: GroupInfo,
        bot_permissions: [PermissionsBitField.Flags.SendMessages],
    }
}

function generateModalWindow(){
    const modal = new ModalBuilder()
        .setCustomId('reportModal')
        .setTitle(i18next.t("commands:report_modal_title"));

    const reportInput = new TextInputBuilder()
        .setCustomId('reportInput')
        .setLabel(i18next.t("commands:report_modal_text_label"))
        .setStyle(TextInputStyle.Paragraph)
        .setMinLength(20)
        .setPlaceholder(i18next.t("commands:report_modal_text_placeholder"))
        .setRequired(true)

    const firstActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(reportInput);

    modal.addComponents(firstActionRow);

    return modal
}

