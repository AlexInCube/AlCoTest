import {BotEvent} from "../Types";
import {CheckBotPermissionsInChannel} from "../utilities/checkBotPermissionsInChannel";
import {TextChannel} from "discord.js";
import process from "process";

const prefix = process.env.BOT_COMMAND_PREFIX

const event: BotEvent = {
    name: "messageCreate",
    execute: async function (message) {
        if (!message.author || message.author.bot) return;
        if (!message.content.startsWith(prefix)) return;//Проверка префикса сообщения

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
            if (!CheckBotPermissionsInChannel(message.channel as TextChannel, command.bot_permissions)) {
                void await message.reply({
                    content: ':no_entry: У БОТА недостаточно прав на этом канале или сервере :no_entry:.\n' +
                        'Напишите /help (название команды), чтобы увидеть недостающие права. \n' +
                        'А также попросите администрацию сервера их выдать боту.'
                })
                return
            }
        }

        await command.executeText(message, args)
    }
}

export default event