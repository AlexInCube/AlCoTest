import {EmbedBuilder} from "discord.js";

export function generateErrorEmbed(errorMessage: string): EmbedBuilder{
    return new EmbedBuilder()
        .setTitle("⚠️ Ошибка")
        .setColor("Red")
        .setDescription(errorMessage.slice(0, 2048))
}