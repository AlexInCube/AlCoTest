import {Audio} from "../../../main";
import {generateErrorEmbed} from "../../../utilities/generateErrorEmbed";
import {ChatInputCommandInteraction, Message} from "discord.js";

export async function AudioCommandWrapperText(message: Message, callback: () => void) {
    if (Audio.playersManager.has(message.guildId!)) {
        callback()
    } else {
        await message.reply({embeds: [generateErrorEmbed("Плеера не существует")]})
    }
}
export async function AudioCommandWrapperInteraction(interaction: ChatInputCommandInteraction, callback: () => void) {
    if (Audio.playersManager.has(interaction.guildId!)) {
        callback()
    } else {
        await interaction.reply({embeds: [generateErrorEmbed("Плеера не существует")]})
    }
}