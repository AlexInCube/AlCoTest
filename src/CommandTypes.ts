import {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    Message,
    PermissionResolvable,
    SlashCommandBuilder
} from "discord.js";

export enum CommandGroup {
    Audio = "audio",
    Fun = "fun",
    Other = "other"
}

export type SlashBuilder =
    | SlashCommandBuilder
    | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>
export interface ICommand{
    name: string,
    description: string;
    arguments? : string[],
    group: CommandGroup;
    slash_builder: SlashBuilder,
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>,
    executeText: (message: Message, args: Array<string>) => Promise<void>,
    user_permissions?: Array<PermissionResolvable>,
    bot_permissions: Array<PermissionResolvable>,
    autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>,
    guild_only?: boolean
}