import {CommandArgument, ICommand} from "../../CommandTypes.js";
import {Guild, PermissionsBitField, SlashCommandBuilder} from "discord.js";
import {setGuildOption} from "../../handlers/MongoSchemas/SchemaGuild.js";
import {GroupAdmin} from "./AdminTypes.js";

const command : ICommand = {
    name: "setprefix",
    description: 'Меняет префикс для ТЕКСТОВЫХ команд (которые пишутся не через / ) и только для текущего сервера',
    arguments: [new CommandArgument("символ", true)],
    slash_builder: new SlashCommandBuilder()
        .setName('setprefix')
        .setDescription('Меняет префикс для ТЕКСТОВЫХ команд (которые пишутся не через / ) и только для текущего сервера')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addStringOption(option =>
            option.setName('newprefix')
                .setNameLocalizations({
                    ru: 'символ'
                })
                .setDescription('Не забудьте сообщить остальным участникам сервера об изменённом префиксе')
                .setRequired(true)
        ),
    guild_only: true,
    group: GroupAdmin,
    user_permissions: [PermissionsBitField.Flags.Administrator],
    bot_permissions: [PermissionsBitField.Flags.SendMessages],
    execute: async (interaction) => {
        const prefix: string | null = interaction.options.getString('newprefix')
        if (!prefix) return
        if (!interaction.guild) return
        await interaction.reply({
            content: await changePrefixTo(interaction.guild, prefix),
            allowedMentions: { users : []}
        })
    },
    executeText: async (message, args) => {
        const prefix = args[0]
        if (!prefix) return;
        if (!message.guild) return;
        await message.reply({content: await changePrefixTo(message.guild, prefix)})
    }
}

async function changePrefixTo(guild: Guild, prefix: string): Promise<string> {
    if (prefix === "/" || prefix === "@" || prefix === "#") return "Нельзя указывать символы \"/ @ #\" в качестве префикса"
    if (prefix.length >= 2) return "Префикс не может быть длиннее одного символов"
    await setGuildOption(guild, "prefix", prefix)
    return `Префикс на этом сервере успешно изменён на ${prefix}`
}

export default command
