import {Interaction} from "discord.js";

export async function autocompleteHandler(interaction: Interaction) {
    if (!interaction.isAutocomplete()) return;
    const {commandName} = interaction
    const command = interaction.client.commands.get(commandName)
    if (!command?.slash_data?.autocomplete) return


    try {
        if (command) {
            await command.slash_data.autocomplete(interaction)
        }
    } catch (e) {
        //loggerSend(e)
    }
}
