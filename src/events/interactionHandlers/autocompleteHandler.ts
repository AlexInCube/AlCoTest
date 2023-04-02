import {loggerSend} from "../../utilities/logger";

export async function autocompleteHandler(interaction: any) {
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