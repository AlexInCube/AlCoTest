import {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    Message,
    PermissionResolvable,
    SlashCommandBuilder
} from "discord.js";

export interface ICommandGroup {
    name: string;
    icon_emoji: string;
    commands: Array<ICommand>
}

export type SlashBuilder =
    | SlashCommandBuilder
    | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>
export interface ICommand{
    name: string,
    description: string;
    arguments? : Array<CommandArgument>,
    group: ICommandGroup;
    slash_builder?: SlashBuilder,
    execute?: (interaction: ChatInputCommandInteraction) => Promise<void>,
    executeText: (message: Message, args: Array<string>) => Promise<void>,
    user_permissions?: Array<PermissionResolvable>,
    bot_permissions: Array<PermissionResolvable>,
    autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>,
    guild_only?: boolean,
    voice_channel_only?: boolean
}

export class CommandArgument {
    readonly name: string;
    readonly required: boolean;

    constructor(name: string, required= false) {
        this.name = name
        this.required = required
    }
}