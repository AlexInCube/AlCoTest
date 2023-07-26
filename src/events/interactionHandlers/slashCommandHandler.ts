import {GuildMember, Interaction, TextChannel} from "discord.js";
import {generateErrorEmbed} from "../../utilities/generateErrorEmbed.js";
import {checkBotInVoice} from "../../utilities/checkBotInVoice.js";
import {checkMemberInVoiceWithBot} from "../../utilities/checkMemberInVoiceWithBot.js";
import {checkMemberInVoice} from "../../utilities/checkMemberInVoice.js";
import {CheckBotPermissions} from "../../utilities/checkPermissions.js";
import {loggerError} from "../../utilities/logger.js";
import {loggerPrefixCommandHandler} from "../../handlers/Command.handler.js";
import i18next from "i18next";
import {ICommand} from "../../CommandTypes.js";

export async function slashCommandHandler(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return
    try {
        const {commandName} = interaction
        const command: ICommand | undefined = interaction.client.commands.get(commandName)

        if (!command) return
        if (!command.slash_data) return

        if (command.guild_data?.guild_only) {
            if (!interaction.guild) {
                await interaction.reply({
                    embeds: [generateErrorEmbed(i18next.t("commandshandlers:command_only_in_guilds"))],
                    ephemeral: true
                })
                return
            }

            if (command.guild_data.voice_required) {
                if (command.guild_data.voice_with_bot_only) {
                    if (checkBotInVoice(interaction.guild)) {
                        const checkObj = await checkMemberInVoiceWithBot(<GuildMember>interaction.member)
                        if (!checkObj.channelTheSame) {
                            await interaction.reply({
                                embeds: [generateErrorEmbed(checkObj.errorMessage)],
                                ephemeral: true
                            })
                            return
                        }
                    }
                }

                if (!checkMemberInVoice(<GuildMember>interaction.member)) {
                    await interaction.reply({
                        embeds: [generateErrorEmbed(i18next.t("commandshandlers:command_only_in_voice"))],
                        ephemeral: true
                    })
                    return
                }
            }
        }

        if (interaction.guild) {// Если мы пишем в личку боту, то никакого сервера/гильдии быть не может. Соответственно как и привилегий в личных сообщениях
            if (!CheckBotPermissions(interaction.channel as TextChannel, command.bot_permissions)) {
                await interaction.reply({
                    embeds: [generateErrorEmbed(`:no_entry: ${i18next.t("commandshandlers:bot_not_enough_permissions_1")} :no_entry:.\n` +
                        `${i18next.t("commandshandlers:bot_not_enough_permissions_2")} \n` +
                        `${i18next.t("commandshandlers:bot_not_enough_permissions_3")}`)], ephemeral: true
                })
                return
            }
        }

        await command.slash_data.execute(interaction)
    } catch (e) {
        loggerError(`${i18next.t("commandshandlers:text_command_error")}: ${e}`, loggerPrefixCommandHandler)
    }
}
