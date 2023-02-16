import {BotEvent} from "../Types";
import {CheckBotPermissions, CheckMemberPermissions} from "../utilities/checkPermissions";
import {TextChannel} from "discord.js";
import process from "process";
import {MongoCheckConnection} from "../handlers/Mongo.handler";
import {getGuildOption} from "../handlers/MongoSchemas/SchemaGuild";

const event: BotEvent = {
    name: "messageCreate",
    execute: async function (message) {
        if (!message.author || message.author.bot) return;

        let prefix = process.env.BOT_COMMAND_PREFIX

        if (message.guild){
            if (MongoCheckConnection()) {
                const guildPrefix = await getGuildOption(message.guild, "prefix")
                if (guildPrefix) prefix = guildPrefix;
            }
        }

        if (!message.content.startsWith(prefix) && !message.content.startsWith(process.env.BOT_COMMAND_PREFIX)) return;//Проверка префикса сообщения

        const args = message.content.substring(prefix.length).toLowerCase().split(" ")
        const command = message.client.commands.get(args[0])

        if (!command) return;

        if (command.guild_only) {
            if (!message.guild) {
                await message.reply({content: 'Эта команда может выполняться только на серверах'})
                return
            }
        }

        if (message.guild){// Если мы пишем в личку боту, то никакого сервера/гильдии быть не может. Соответственно как и привилегий в личных сообщениях
            if (!CheckBotPermissions(message.channel as TextChannel, command.bot_permissions)) {
                void await message.reply({
                    content: ':no_entry: У БОТА недостаточно прав на этом канале или сервере :no_entry:.\n' +
                        'Напишите /help (название команды), чтобы увидеть недостающие права. \n' +
                        'А также попросите администрацию сервера их выдать боту.'
                })
                return
            }

            if (!CheckMemberPermissions(message.guild.members.cache.get(message.author.id), command.user_permissions)){
                void await message.reply({
                    content: ':no_entry: У вас недостаточно прав на этом канале или сервере :no_entry:'
                })
                return
            }
        }

        await command.executeText(message, args)
    }
}

export default event