import {CommandArgument, ICommand} from "../../CommandTypes.js";
import {Guild, Message, PermissionsBitField, SlashCommandBuilder} from "discord.js";
import {setGuildOption} from "../../handlers/MongoSchemas/SchemaGuild.js";
import {GroupAdmin} from "./AdminTypes.js";
import i18next from "i18next";

export default function(): ICommand {
    return {
        text_data: {
            name: "setprefix",
            description: i18next.t("commands:set_prefix_desc"),
            arguments: [new CommandArgument("символ", true)],
            execute: async (message: Message, args: string[]): Promise<void> => {
                const prefix: string = args[0]
                if (!prefix) return;
                if (!message.guild) return;
                await message.reply({content: await changePrefixTo(message.guild, prefix)})
            }
        },
        slash_data: {
            slash_builder: new SlashCommandBuilder()
                .setName('setprefix')
                .setDescription(i18next.t("commands:set_prefix_desc"))
                .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
                .addStringOption(option =>
                    option.setName('newprefix')
                        .setDescription(i18next.t("commands:set_prefix_arg_newprefix_desc"))
                        .setRequired(true)
                ),
            execute: async (interaction) => {
                const prefix: string | null = interaction.options.getString('newprefix')
                if (!prefix) return
                if (!interaction.guild) return
                await interaction.reply({
                    content: await changePrefixTo(interaction.guild, prefix),
                    allowedMentions: { users : []}
                })
            },
        },
        guild_data: {
            guild_only: true
        },
        group: GroupAdmin,
        user_permissions: [PermissionsBitField.Flags.Administrator],
        bot_permissions: [PermissionsBitField.Flags.SendMessages],
    }
}

async function changePrefixTo(guild: Guild, prefix: string): Promise<string> {
    if (prefix === "/" || prefix === "@" || prefix === "#") return i18next.t("commands:set_prefix_restrict_prefixes", {prefixes: "/ @ #"}) as string
    if (prefix.length > 1) return i18next.t("commands:set_prefix_length_error") as string
    await setGuildOption(guild, "prefix", prefix)
    return i18next.t("commands:set_prefix_success_change", {prefix: prefix}) as string
}

