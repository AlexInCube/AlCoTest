import {BotEvent} from "../Types";
import {CheckBotPermissions} from "../utilities/checkPermissions";
import {TextChannel} from "discord.js";
import {loggerSend} from "../utilities/logger";
import {checkMemberInVoiceWithBot} from "../utilities/checkMemberInVoiceWithBot";
import {checkMemberInVoice} from "../utilities/checkMemberInVoice";
import {checkBotInVoice} from "../utilities/checkBotInVoice";
import {generateErrorEmbed} from "../utilities/generateErrorEmbed";

const event: BotEvent = {
    name: "interactionCreate",
    execute: async (interaction) => {
        // Если это команда из чата, выполняем её.
        if (interaction.isChatInputCommand()) {
            try{
                const { commandName } = interaction
                const command = interaction.client.commands.get(commandName) // получение команды из коллекции

                if (!command) return
                if (command.guild_only) {
                    if (!interaction.guild) {
                        await interaction.reply({embeds: [generateErrorEmbed('Эта команда может выполняться только на серверах')], ephemeral: true})
                        return
                    }

                    if (command.voice_required){
                        if (command.voice_with_bot_only){
                            if (checkBotInVoice(interaction.member.guild)){
                                const checkObj = await checkMemberInVoiceWithBot(interaction.member)
                                if (!checkObj.channelTheSame){
                                    await interaction.reply({embeds: [generateErrorEmbed(checkObj.errorMessage)], ephemeral: true})
                                    return
                                }
                            }
                        }

                        if (!checkMemberInVoice(interaction.member)){
                            await interaction.reply({embeds: [generateErrorEmbed('Вы должны быть в любом голосовом канале для выполнения этой команды')], ephemeral: true})
                            return
                        }
                    }
                }

                if (interaction.guild){// Если мы пишем в личку боту, то никакого сервера/гильдии быть не может. Соответственно как и привилегий в личных сообщениях
                    if (!CheckBotPermissions(interaction.channel as TextChannel, command.bot_permissions)) {
                        await interaction.reply({embeds: [generateErrorEmbed(':no_entry: У БОТА недостаточно прав на этом канале или сервере :no_entry:.\n' +
                                'Напишите /help (название команды), чтобы увидеть недостающие права. \n' +
                                'А также попросите администрацию сервера их выдать боту.')], ephemeral: true})
                        return
                    }
                }

                await command.execute(interaction)
            } catch (e) {
                loggerSend(e)
            }
        } else if (interaction.isAutocomplete()) {
            const { commandName } = interaction
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
    }
}

export default event