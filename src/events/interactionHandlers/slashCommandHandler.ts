import {TextChannel} from "discord.js";
import {generateErrorEmbed} from "../../utilities/generateErrorEmbed.js";
import {checkBotInVoice} from "../../utilities/checkBotInVoice.js";
import {checkMemberInVoiceWithBot} from "../../utilities/checkMemberInVoiceWithBot.js";
import {checkMemberInVoice} from "../../utilities/checkMemberInVoice.js";
import {CheckBotPermissions} from "../../utilities/checkPermissions.js";
import {loggerSend} from "../../utilities/logger.js";
import {loggerPrefixCommandHandler} from "../../handlers/Command.handler.js";

export async function slashCommandHandler(interaction: any) {
    if (!interaction.isChatInputCommand()) return
    try {
        const {commandName} = interaction
        const command = interaction.client.commands.get(commandName) // получение команды из коллекции

        if (!command) return
        if (command.guild_only) {
            if (!interaction.guild) {
                await interaction.reply({
                    embeds: [generateErrorEmbed('Эта команда может выполняться только на серверах')],
                    ephemeral: true
                })
                return
            }

            if (command.voice_required) {
                if (command.voice_with_bot_only) {
                    if (checkBotInVoice(interaction.member.guild)) {
                        const checkObj = await checkMemberInVoiceWithBot(interaction.member)
                        if (!checkObj.channelTheSame) {
                            await interaction.reply({
                                embeds: [generateErrorEmbed(checkObj.errorMessage)],
                                ephemeral: true
                            })
                            return
                        }
                    }
                }

                if (!checkMemberInVoice(interaction.member)) {
                    await interaction.reply({
                        embeds: [generateErrorEmbed('Вы должны быть в любом голосовом канале для выполнения этой команды')],
                        ephemeral: true
                    })
                    return
                }
            }
        }

        if (interaction.guild) {// Если мы пишем в личку боту, то никакого сервера/гильдии быть не может. Соответственно как и привилегий в личных сообщениях
            if (!CheckBotPermissions(interaction.channel as TextChannel, command.bot_permissions)) {
                await interaction.reply({
                    embeds: [generateErrorEmbed(':no_entry: У БОТА недостаточно прав на этом канале или сервере :no_entry:.\n' +
                        'Напишите /help (название команды), чтобы увидеть недостающие права. \n' +
                        'А также попросите администрацию сервера их выдать боту.')], ephemeral: true
                })
                return
            }
        }

        await command.execute(interaction)
    } catch (e) {
        loggerSend(`${loggerPrefixCommandHandler}` + e)
    }
}
