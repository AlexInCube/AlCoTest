import {Audio} from "../../../main";
import {generateErrorEmbed} from "../../../utilities/generateErrorEmbed";
import {ChatInputCommandInteraction, Message} from "discord.js";

export async function AudioCommandWrapperText(message: Message, callback: () => void) {
    const player = Audio.playersManager.get(message.guildId!)
    if (player) {
        if (player.getState() == "loading"){
            await message.reply({embeds: [generateErrorEmbed("Песни всё ещё обрабатываются, подожди")]})
            return
        }
        callback()
    } else {
        await message.reply({embeds: [generateErrorEmbed("Плеера не существует")]})
    }
}
export async function AudioCommandWrapperInteraction(interaction: ChatInputCommandInteraction, callback: () => void) {
    const player = Audio.playersManager.get(interaction.guildId!)
    if (player) {
        if (player.getState() == "loading"){
            await interaction.reply({embeds: [generateErrorEmbed("Песни всё ещё обрабатываются, подожди")], ephemeral: true})
            return
        }
        callback()
    } else {
        await interaction.reply({embeds: [generateErrorEmbed("Плеера не существует")], ephemeral: true})
    }
}
