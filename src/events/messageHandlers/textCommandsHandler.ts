import {MongoCheckConnection} from "../../handlers/Mongo.handler.js";
import {getGuildOption} from "../../handlers/MongoSchemas/SchemaGuild.js";
import {ICommand} from "../../CommandTypes.js";
import {generateSpecificCommandHelp} from "../../commands/info/help.command.js";
import {generateErrorEmbed} from "../../utilities/generateErrorEmbed.js";
import {checkBotInVoice} from "../../utilities/checkBotInVoice.js";
import {checkMemberInVoiceWithBot} from "../../utilities/checkMemberInVoiceWithBot.js";
import {checkMemberInVoice} from "../../utilities/checkMemberInVoice.js";
import {CheckBotPermissions, CheckMemberPermissions} from "../../utilities/checkPermissions.js";
import {Client, Message, TextChannel} from "discord.js";
import {loggerSend} from "../../utilities/logger.js";
import i18next from "i18next";
import {loggerPrefixCommandHandler} from "../../handlers/Command.handler.js";
import {ENV} from "../../EnvironmentTypes.js";

export async function textCommandsHandler(client: Client, message: Message){
    try{
        if (!message.author || message.author.bot) return;

        let prefix: string = ENV.BOT_COMMAND_PREFIX

        if (!message.content.startsWith(ENV.BOT_COMMAND_PREFIX)){
            if (message.guild){
                if (MongoCheckConnection()) {
                    const guildPrefix = await getGuildOption(message.guild, "prefix")
                    if (guildPrefix) prefix = guildPrefix;
                }
            }
        }

        if (!message.content.startsWith(prefix)) return;

        const args = message.content.substring(prefix.length).split(" ")
        const command: ICommand | undefined = message.client.commands.get(args.shift() ?? "")

        if (!command) return;

        if (command.text_data.arguments){
            let requiredArgsCount = 0

            command.text_data.arguments.forEach((arg) => {if (arg.required){requiredArgsCount++}})

            if (requiredArgsCount > args.length){
                if (message.guild){
                    await message.reply({embeds: [generateSpecificCommandHelp(command.text_data.name, client, {guild: message.guild, member: message.member!})]})
                    return
                }
                await message.reply({embeds: [generateSpecificCommandHelp(command.text_data.name, client)]})
                return
            }
        }

        if (command?.guild_data?.guild_only) { // If command allowed only in guild, check voice_required and voice_with_bot_only properties
            if (!message.guild) {
                await message.reply({embeds: [generateErrorEmbed(i18next.t("commandshandlers:command_only_in_guilds"))]})
                return
            }

            if (command.guild_data.voice_required){
                if (command.guild_data.voice_with_bot_only){
                    if (checkBotInVoice(message.member!.guild)){
                        const checkObj = await checkMemberInVoiceWithBot(message.member!)
                        if (!checkObj.channelTheSame){
                            await message.reply({content: checkObj.errorMessage})
                            return
                        }
                    }
                }

                if (!checkMemberInVoice(message.member!)){
                    await message.reply({embeds: [generateErrorEmbed(i18next.t("commandshandlers:command_only_in_voice"))]})
                    return
                }
            }
        }

        if (message.guild){ // If we used command in guild, then check permissions
            // Check bot permissions for command executing
            if (!CheckBotPermissions(message.channel as TextChannel, command.bot_permissions)) {
                await message.reply({
                    embeds: [generateErrorEmbed(`:no_entry: ${i18next.t("commandshandlers:bot_not_enough_permissions_1")} :no_entry:.\n` +
                        `${i18next.t("commandshandlers:bot_not_enough_permissions_2")} \n` +
                        `${i18next.t("commandshandlers:bot_not_enough_permissions_3")}`)]
                })
                return
            }

            // Check user permissions to allow executing requested command
            const member = message.guild.members.cache.get(message.author.id)
            if (member){
                if (!CheckMemberPermissions(member, command.user_permissions)){
                    await message.reply({embeds: [generateErrorEmbed(i18next.t("commandshandlers:user_not_enough_permissions"))]})
                    return
                }
            }
        }

        await command.text_data.execute(message, args)
    } catch (e) {
        loggerSend(`${i18next.t("commandshandlers:text_command_error")}: ${e}`, loggerPrefixCommandHandler)
    }
}
