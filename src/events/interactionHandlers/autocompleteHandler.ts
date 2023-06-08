import {loggerSend} from "../../utilities/logger.js";
import {Interaction} from "discord.js";

export async function autocompleteHandler(interaction: Interaction) {
    if (!interaction.isAutocomplete()) return;
    const {commandName} = interaction
    const command = interaction.client.commands.get(commandName) // получение команды из коллекции
    if (!command?.autocomplete) return

    try {
        if (command) {
            await command.autocomplete(interaction)
        }
    } catch (e) {
        loggerSend(e)
    }
}
