import {submitReport} from "../../handlers/MongoSchemas/SchemaReport.js";
import {Interaction} from "discord.js";

export async function modalsHandler(interaction: Interaction) {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId === 'reportModal') {
        await interaction.reply({content: 'Возможно я к тебе прислушаюсь', ephemeral: true});

        const reportInput = interaction.fields.getTextInputValue('reportInput');
        const overpoweredHuman = interaction.client.users.cache.get(process.env.BOT_DISCORD_OVERPOWERED_ID)
        if (overpoweredHuman){
            await overpoweredHuman.send(`Пришёл новый репорт от ${interaction.user.username} с ID: ${interaction.user.id}\n\n${reportInput}`)
        }
        await submitReport(interaction.user.id, reportInput)
    }
}
