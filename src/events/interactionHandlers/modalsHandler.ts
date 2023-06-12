import {submitReport} from "../../handlers/MongoSchemas/SchemaReport.js";
import {Interaction} from "discord.js";
import i18next from "i18next";

export async function modalsHandler(interaction: Interaction) {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId === 'reportModal') {
        await interaction.reply({content: i18next.t("commands:report_modal_feedback") as string, ephemeral: true});

        const reportInput = interaction.fields.getTextInputValue('reportInput');
        const overpoweredHuman = interaction.client.users.cache.get(process.env.BOT_DISCORD_OVERPOWERED_ID)
        if (overpoweredHuman){
            await overpoweredHuman.send(`New report from ${interaction.user.username} with ID: ${interaction.user.id}\n\n${reportInput}`)
        }
        await submitReport(interaction.user.id, reportInput)
    }
}
