import {EmbedBuilder} from "discord.js";
import i18next from "i18next";

export function generateErrorEmbed(errorMessage: string): EmbedBuilder{
    return new EmbedBuilder()
        .setTitle(`⚠️ ${i18next.t("general:error")}`)
        .setColor("Red")
        .setDescription(errorMessage.slice(0, 2048))
}
