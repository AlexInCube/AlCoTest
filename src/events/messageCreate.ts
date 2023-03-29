import {BotEvent} from "../Types";
import {CheckBotPermissions, CheckMemberPermissions} from "../utilities/checkPermissions";
import {TextChannel} from "discord.js";
import process from "process";
import {MongoCheckConnection} from "../handlers/Mongo.handler";
import {getGuildOption} from "../handlers/MongoSchemas/SchemaGuild";
import {ICommand} from "../CommandTypes";
import {generateSpecificCommandHelp} from "../commands/info/help.command";
import {client} from "../main";
import {loggerSend} from "../utilities/logger";
import {checkMemberInVoice} from "../utilities/checkMemberInVoice";
import {checkMemberInVoiceWithBot} from "../utilities/checkMemberInVoiceWithBot";
import {checkBotInVoice} from "../utilities/checkBotInVoice";
import {generateErrorEmbed} from "../utilities/generateErrorEmbed";

const event: BotEvent = {
    name: "messageCreate",
    execute: async function (message) {
        try{
            if (!message.author || message.author.bot) return;

            let prefix = process.env.BOT_COMMAND_PREFIX

            if (message.guild){
                if (MongoCheckConnection()) {
                    const guildPrefix = await getGuildOption(message.guild, "prefix")
                    if (guildPrefix) prefix = guildPrefix;
                }
            }

            if (!message.content.startsWith(prefix) && !message.content.startsWith(process.env.BOT_COMMAND_PREFIX)) return;//Проверка префикса сообщения

            const args = message.content.substring(prefix.length).split(" ")
            const command: ICommand | undefined = message.client.commands.get(args.shift())

            if (!command) return;

            if (command.arguments){
                let requiredArgsCount = 0

                command.arguments.forEach((arg) => {if (arg.required){requiredArgsCount++}})

                if (requiredArgsCount > args){
                    if (message.guild){
                        await message.reply({embeds: [generateSpecificCommandHelp(command.name, client, {guild: message.guild, member: message.member})]})
                        return
                    }
                    await message.reply({embeds: [generateSpecificCommandHelp(command.name, client)]})
                    return
                }
            }

            if (command.guild_only) {
                if (!message.guild) {
                    await message.reply({embeds: [generateErrorEmbed('Эта команда может выполняться только на серверах')], ephemeral: true})
                    return
                }

                if (command.voice_required){
                    if (command.voice_with_bot_only){
                        if (checkBotInVoice(message.member.guild)){
                            const checkObj = await checkMemberInVoiceWithBot(message.member)
                            if (!checkObj.channelTheSame){
                                await message.reply({content: checkObj.errorMessage})
                                return
                            }
                        }
                    }

                    if (!checkMemberInVoice(message.member)){
                        await message.reply({embeds: [generateErrorEmbed('Вы должны быть в любом голосовом канале для выполнения этой команды')]})
                        return
                    }
                }
            }

            if (message.guild){// Если мы пишем в личку боту, то никакого сервера/гильдии быть не может. Соответственно как и привилегий в личных сообщениях
                if (!CheckBotPermissions(message.channel as TextChannel, command.bot_permissions)) {
                    await message.reply({
                        embeds: [generateErrorEmbed(':no_entry: У БОТА недостаточно прав на этом канале или сервере :no_entry:.\n' +
                            'Напишите /help (название команды), чтобы увидеть недостающие права. \n' +
                            'А также попросите администрацию сервера их выдать боту.')]
                    })
                    return
                }

                if (!CheckMemberPermissions(message.guild.members.cache.get(message.author.id), command.user_permissions)){
                    await message.reply({embeds: [generateErrorEmbed('У вас недостаточно прав на этом канале или сервере')]})
                    return
                }
            }

            await command.executeText(message, args)
        } catch (e) {
            loggerSend(e)
        }
    }
}

export default event