import {CommandGroup, ICommand} from "../../CommandTypes";
import {
    Client,
    EmbedBuilder, Guild, PermissionResolvable,
    PermissionsBitField,
    SlashCommandBuilder
} from "discord.js";
import "../../Types"
import * as process from "process";

const command : ICommand = {
    name: "help",
    description: "Подробное описание команд",
    group: CommandGroup.Other,
    bot_permissions: [PermissionsBitField.Flags.SendMessages],
    slash_builder: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Подробное описание команд")
        .addStringOption(option =>
            option.setName('command')
                .setNameLocalizations({
                    ru: 'команда'
                })
                .setDescription('Подробности об указанной команде')
                .setRequired(false)
                .setAutocomplete(true)
        ),
    autocomplete: async (interaction) => {
        const commandsList = [...interaction.client.commands].map((commandEntry) => {
            return {
                name: commandEntry[0],
                value: commandEntry[0]
            }
        })

        await interaction.respond(commandsList)
    },
    execute: async (interaction) => {
        const commandName: string | null = interaction.options.getString('command')
        if (commandName) { // Если конкретная команда не указана, то выводим список
            if (interaction.guild){
                await interaction.reply({ embeds: [generateSpecificCommandHelp(commandName, interaction.client, interaction.guild)], ephemeral: true })
                return
            }
            await interaction.reply({ embeds: [generateSpecificCommandHelp(commandName, interaction.client)], ephemeral: true })
        } else { // Если указана конкретная команда
            await interaction.reply({ embeds: [generateCommandsEmbedList(interaction.client)], ephemeral: true })
        }
    },
    executeText: async (message, args) => {
        const commandName: string = args[1]
        if (commandName) { // Если конкретная команда не указана, то выводим список
            if (message.guild){
                await message.reply({
                    embeds: [generateSpecificCommandHelp(commandName, message.client, message.guild)],
                    allowedMentions: { users : []}
                })
                return
            }
            await message.reply({
                embeds: [generateSpecificCommandHelp(commandName, message.client)],
                allowedMentions: { users : []}
            })
        } else { // Если указана конкретная команда
            await message.reply({
                embeds: [generateCommandsEmbedList(message.client)],
                allowedMentions: { users : []}
            })
        }
    }
}
function generateSpecificCommandHelp (commandName: string, client: Client, guild?: Guild) {
    const command = client.commands.get(commandName)

    const helpEmbed = new EmbedBuilder()
        .setColor('#436df7')
        .setTitle(`Команда ${commandName} не найдена`)

    if (!command) {
        return helpEmbed
    }

    if (!guild){
        helpEmbed
            .setTitle(`/${command.name} ${command.arguments ?? ""}`)
            .setDescription(command.description)

        return helpEmbed
    }

    if (!guild.members.me) {helpEmbed.setTitle(`Произошла ошибка`); return helpEmbed;}

    let permissionsString = ''
    const bot = guild.members.me

    command.bot_permissions.forEach(function (value) {
        if (bot.permissions.has(value)) {
            permissionsString += '✅'
        } else {
            permissionsString += '❌'
        }
        permissionsString += '  ' + convertPermissionsToLocaleString(value) + '\n'
    })

    helpEmbed
        .setTitle(`/${command.name} ${command.arguments ?? ""}`)
        .setDescription(command.description)
        .addFields({ name: 'Права требуемые для БОТА, не для пользователя: ', value: permissionsString || 'Права не требуются' })

    return helpEmbed
}

function generateCommandsEmbedList (client: Client): EmbedBuilder {
    const helpEmbed = new EmbedBuilder()
        .setColor('#436df7')
        .setTitle('Справка о командах')
        .setDescription(
            `Вы можете писать команды через ординарный / (в этом случае ваши сообщения никто не увидит) 
            или используйте ${process.env.BOT_COMMAND_PREFIX} чтобы быстро писать команды`
        )

    client.commandsGroups.forEach((values, keys) => {
        let commandsList = ''
        values.forEach((value) => {
            commandsList += `\`${value.name}\` `
        })
        helpEmbed.addFields({ name: convertGroupToLocaleString(keys), value: commandsList, inline: false })
    })

    return helpEmbed
}

function convertGroupToLocaleString (group: string) {
    switch (group) {
        case 'audio': return 'Аудио'
        case 'fun': return 'Развлечения'
        case 'other': return 'Остальное'
        default: return 'НЕИЗВЕСТНО'
    }
}

function convertPermissionsToLocaleString (permission: PermissionResolvable) {
    switch (permission) {
        case PermissionsBitField.Flags.SendMessages: return 'Отправлять сообщения'
        case PermissionsBitField.Flags.ManageMessages: return 'Управлять сообщениями'
        case PermissionsBitField.Flags.Connect: return 'Подключаться'
        case PermissionsBitField.Flags.Speak: return 'Говорить'
        case PermissionsBitField.Flags.ViewChannel: return 'Просматривать каналы'
        case PermissionsBitField.Flags.AttachFiles: return 'Прикреплять файлы'
        default: return 'Не найдено название прав: ' + permission
    }
}

export default command