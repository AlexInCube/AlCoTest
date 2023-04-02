import {submitReport} from "../../handlers/MongoSchemas/SchemaReport";
import {Interaction} from "discord.js";

export async function modalsHandler(interaction: Interaction) {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId === 'reportModal') {
        await interaction.reply({content: 'Возможно я к тебе прислушаюсь', ephemeral: true});

        const reportInput = interaction.fields.getTextInputValue('reportInput');
        await submitReport(interaction.user.id, reportInput)
    }
}