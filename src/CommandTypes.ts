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
    text_data: ITextCommandData, // Related to text commands
    slash_data?: ISlashCommandData, // Related to slash commands
    group: ICommandGroup, // Group for better orientation in /help
    user_permissions?: Array<PermissionResolvable>, // Permissions for user, to allow executing commands
    bot_permissions: Array<PermissionResolvable>, // Permissions for bot, to try to execute commands
    hidden?: boolean, // Hidden from everything (disable slash_data property if true)
    guild_data?: IGuildData // Guild related data such as voice settings
}

interface ITextCommandData{
    name: string,
    description: string,
    arguments? : Array<CommandArgument>,
    execute: (message: Message, args: Array<string>) => Promise<void>,
}

export class CommandArgument {
    readonly name: string;
    readonly required: boolean;

    constructor(name: string, required= false) {
        this.name = name
        this.required = required
    }
}

interface ISlashCommandData{
    slash_builder: SlashBuilder,
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>,
    autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>,
}

interface IGuildData{
    guild_only?: boolean | false,
    voice_required?: boolean,
    voice_with_bot_only?: boolean // Property enabled only if voice_required is true
}

