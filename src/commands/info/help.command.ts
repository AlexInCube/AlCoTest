import {CommandArgument, ICommand, ICommandGroup} from "../../CommandTypes.js";
import {
    Client,
    EmbedBuilder,
    Guild,
    GuildMember,
    PermissionResolvable,
    PermissionsBitField,
    SlashCommandBuilder
} from "discord.js";
import "../../Types.js"
import * as process from "process";
import {GroupInfo} from "./InfoTypes.js";
import {getGuildOption} from "../../handlers/MongoSchemas/SchemaGuild.js";

const command : ICommand = {
    name: "help",
    description: "Подробное описание команд",
    arguments: [new CommandArgument("название команды")],
    group: GroupInfo,
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
            if (interaction.guild && interaction.member) {
                await interaction.reply({
                    embeds: [generateSpecificCommandHelp(commandName, interaction.client, {
                        guild: interaction.guild,
                        member: interaction.member as GuildMember
                    })], ephemeral: true
                })
                return
            }
            await interaction.reply({
                embeds: [generateSpecificCommandHelp(commandName, interaction.client)], ephemeral: true
            })
        } else {
            await interaction.reply({ embeds: [await generateCommandsEmbedList(interaction.client, interaction.guild)], ephemeral: true })
        }
    },
    executeText: async (message, args) => {
        const commandName: string = args[0]
        if (commandName) { // Если конкретная команда не указана, то выводим список
            if (message.guild && message.member) {
                await message.reply({
                    embeds: [generateSpecificCommandHelp(commandName, message.client, {guild: message.guild, member: message.member})],
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
                embeds: [await generateCommandsEmbedList(message.client, message.guild)],
                allowedMentions: { users : []}
            })
        }
    }
}
export function generateSpecificCommandHelp (commandName: string, client: Client, guildData?: {guild: Guild, member: GuildMember}) {
    const command = client.commands.get(commandName)

    const helpEmbed = new EmbedBuilder()
        .setColor('#436df7')
        .setTitle(`Команда ${commandName} не найдена`)

    if (!command) {
        return helpEmbed
    }

    let argument_string = ""

    if (command.arguments){
        command.arguments.forEach((value: { required: any; name: any; }) => {
            if (value.required){
                argument_string += `${value.name} `
            }else{
                argument_string += `<${value.name}> `
            }
        })
    }

    helpEmbed
        .setTitle(`/${command.name} ${argument_string}`)
        .setDescription(command.description)

    helpEmbed.addFields({ name: '✉️ Разрешено в личных сообщениях', value: command.guild_only ? "❌ Нет" : "✅ Да", inline: false })

    if (guildData){
        if (!guildData.guild.members.me) {helpEmbed.setTitle(`Произошла ошибка`); return helpEmbed;}

        let permissionsBotString = ''
        const bot = guildData.guild.members.me

        command.bot_permissions.forEach(function (value: PermissionResolvable) {
            if (bot.permissions.has(value)) {
                permissionsBotString += '✅'
            } else {
                permissionsBotString += '❌'
            }
            permissionsBotString += '  ' + convertPermissionsToLocaleString(value) + '\n'
        })

        helpEmbed.addFields({ name: '🤖 Права требуемые для бота', value: permissionsBotString || 'Права не требуются', inline: true })

        let permissionsMemberString = 'Права не требуются'

        if (command.user_permissions){
            permissionsMemberString = ''
            command.user_permissions.forEach(function (value: PermissionResolvable) {
                if (guildData.member.permissions.has(value)) {
                    permissionsMemberString += '✅'
                } else {
                    permissionsMemberString += '❌'
                }
                permissionsMemberString += '  ' + convertPermissionsToLocaleString(value) + '\n'
            })
        }

        helpEmbed.addFields({ name: '🐸 Права требуемые для пользователя: ', value: permissionsMemberString, inline: true })
    }

    return helpEmbed
}

export async function generateCommandsEmbedList(client: Client, guild?: Guild | null): Promise<EmbedBuilder> {
    let prefixes_string = process.env.BOT_COMMAND_PREFIX

    if (guild){
        const prefix = await getGuildOption(guild, "prefix")
        if (prefixes_string !== prefix) {
            prefixes_string += " или " + prefix
        }
    }

    const helpEmbed = new EmbedBuilder()
        .setColor('#436df7')
        .setTitle('Справка о командах')
        .setDescription(
            `Вы можете писать команды через ординарный / (тогда в большинстве случаев ваши сообщения никто не увидит) 
            или используйте префиксы: ${prefixes_string}\n
            Напишите help <название команды> чтобы увидеть подробности\n
            <параметр> - Параметр команды в кавычках необязателен 
            `
        )

    client.commandsGroups.forEach((group) => {
        let commandsList = ''
        group.commands.forEach((value: ICommand) => {
            commandsList += `\`${value.name}\`, `
        })
        helpEmbed.addFields({
            name: group.icon_emoji + convertGroupToLocaleString(group),
            value: commandsList.slice(0, -2),
            inline: false
        })
    })

    return helpEmbed
}

function convertGroupToLocaleString (group: ICommandGroup): string {
    switch (group.name) {
        case 'audio': return 'Аудио'
        case 'fun': return 'Развлечения'
        case 'info': return 'Информация'
        case 'admin': return 'Только для администрации сервера'
        default: return group.name
    }
}

function convertPermissionsToLocaleString (permission: PermissionResolvable): string {
    switch (permission) {
        case PermissionsBitField.Flags.Administrator: return 'Администратор'
        case PermissionsBitField.Flags.SendMessages: return 'Отправлять сообщения'
        case PermissionsBitField.Flags.ManageMessages: return 'Управлять сообщениями'
        case PermissionsBitField.Flags.Connect: return 'Подключаться'
        case PermissionsBitField.Flags.Speak: return 'Говорить'
        case PermissionsBitField.Flags.ViewChannel: return 'Просматривать каналы'
        case PermissionsBitField.Flags.AttachFiles: return 'Прикреплять файлы'
        case PermissionsBitField.Flags.ViewAuditLog: return 'Просмотр журнала аудита'
        default: return 'Не найдено название прав: ' + permission
    }
}

export default command
