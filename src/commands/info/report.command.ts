import {ICommand} from "../../CommandTypes.js";
import {
    ActionRowBuilder, ModalActionRowComponentBuilder,
    ModalBuilder,
    PermissionsBitField,
    SlashCommandBuilder,
    TextInputBuilder,
    TextInputStyle
} from "discord.js";
import {GroupInfo} from "./InfoTypes.js";

const command : ICommand = {
    name: "report",
    description: 'Открывает окно для отправки сообщения разработчику',
    slash_builder: new SlashCommandBuilder()
        .setName('report')
        .setDescription('Открывает окно для отправки сообщения разработчику'),
    group: GroupInfo,
    bot_permissions: [PermissionsBitField.Flags.SendMessages],
    execute: async (interaction) => {
        await interaction.showModal(generateModalWindow())
    },
    executeText: async (message) => {
        await message.reply("К сожалению эта команда работает только если она вызвана через /. Так что напишите /report")
    }
}

function generateModalWindow(){
    const modal = new ModalBuilder()
        .setCustomId('reportModal')
        .setTitle('Создание пожелания');

    const reportInput = new TextInputBuilder()
        .setCustomId('reportInput')
        .setLabel("Какой функционал добавить или что исправить?")
        .setStyle(TextInputStyle.Paragraph)
        .setMinLength(20)
        .setPlaceholder("Описывайте ясно и чётко")
        .setRequired(true)

    const firstActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(reportInput);

    modal.addComponents(firstActionRow);

    return modal
}

export default command
