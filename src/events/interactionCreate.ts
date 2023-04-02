import {BotEvent} from "../Types";
import {slashCommandHandler} from "./interactionHandlers/slashCommandHandler";
import {autocompleteHandler} from "./interactionHandlers/autocompleteHandler";
import {modalsHandler} from "./interactionHandlers/modalsHandler";
import {Events} from "discord.js";

const event: BotEvent = {
    name: Events.InteractionCreate,
    execute: async (interaction) => {
        await slashCommandHandler(interaction)
        await autocompleteHandler(interaction)
        await modalsHandler(interaction)
    }
}

export default event