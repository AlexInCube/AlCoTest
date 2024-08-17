import { CommandArgument, ICommand, ICommandGroup } from '../../CommandTypes.js';
import {
  Client,
  EmbedBuilder,
  Guild,
  GuildMember,
  Message,
  PermissionResolvable,
  PermissionsBitField,
  SlashCommandBuilder
} from 'discord.js';
import '../../DiscordTypes.js';
import { GroupInfo } from './InfoTypes.js';
import i18next from 'i18next';
import { ENV } from '../../EnvironmentVariables.js';
import { getGuildOptionPrefix } from '../../schemas/SchemaGuild.js';

export default function (): ICommand {
  return {
    text_data: {
      name: 'help',
      description: i18next.t('commands:help_desc'),
      arguments: [new CommandArgument(i18next.t('commands:help_arg_command'))],
      execute: async (message: Message, args: string[]) => {
        const commandName: string = args[0];
        if (commandName) {
          // If command not specified, then return the list of commands
          if (message.guild && message.member) {
            await message.reply({
              embeds: [
                generateSpecificCommandHelp(commandName, message.client, {
                  guild: message.guild,
                  member: message.member
                })
              ],
              allowedMentions: { users: [] }
            });
            return;
          }
          await message.reply({
            embeds: [generateSpecificCommandHelp(commandName, message.client)],
            allowedMentions: { users: [] }
          });
        } else {
          // Если указана конкретная команда
          await message.reply({
            embeds: [await generateCommandsEmbedList(message.client, message.guild)],
            allowedMentions: { users: [] }
          });
        }
      }
    },
    slash_data: {
      slash_builder: new SlashCommandBuilder()
        .setName('help')
        .setDescription(i18next.t('commands:help_desc'))
        .addStringOption((option) =>
          option
            .setName('command')
            .setDescription(i18next.t('commands:help_slash_arg_command'))
            .setRequired(false)
            .setAutocomplete(true)
        ),
      execute: async (interaction) => {
        const commandName: string | null = interaction.options.getString('command');
        if (commandName) {
          // If command not specified, then return the list of commands
          if (interaction.guild && interaction.member) {
            await interaction.reply({
              embeds: [
                generateSpecificCommandHelp(commandName, interaction.client, {
                  guild: interaction.guild,
                  member: interaction.member as GuildMember
                })
              ],
              ephemeral: true
            });
            return;
          }
          await interaction.reply({
            embeds: [generateSpecificCommandHelp(commandName, interaction.client)],
            ephemeral: true
          });
        } else {
          await interaction.reply({
            embeds: [await generateCommandsEmbedList(interaction.client, interaction.guild)],
            ephemeral: true
          });
        }
      },
      autocomplete: async (interaction) => {
        const commandsList: Array<{ name: string; value: string }> = [];
        interaction.client.commands.forEach((command: ICommand) => {
          if (command.hidden) return;
          commandsList.push({
            name: command.text_data.name,
            value: command.text_data.name
          });
        });
        await interaction.respond(commandsList);
      }
    },
    group: GroupInfo,
    bot_permissions: [PermissionsBitField.Flags.SendMessages]
  };
}

export function generateSpecificCommandHelp(
  commandName: string,
  client: Client,
  guildData?: { guild: Guild; member: GuildMember }
) {
  const command = client.commands.get(commandName);

  const helpEmbed = new EmbedBuilder()
    .setColor('#436df7')
    .setTitle(i18next.t('commands:help_command_not_found', { commandName: commandName }));

  if (!command) {
    return helpEmbed;
  }

  let argument_string = '';

  if (command.text_data.arguments) {
    command.text_data.arguments.forEach((value: { required: boolean; name: string }) => {
      if (value.required) {
        argument_string += `${value.name} `;
      } else {
        argument_string += `<${value.name}> `;
      }
    });
  }

  helpEmbed.setTitle(`/${command.text_data.name} ${argument_string}`).setDescription(command.text_data.description);

  helpEmbed.addFields({
    name: `✉️ ${i18next.t('commands:help_allowed_in_dm')}`,
    value: command.guild_data?.guild_only ? '❌' : '✅',
    inline: false
  });

  if (guildData) {
    if (!guildData.guild.members.me) {
      helpEmbed.setTitle(i18next.t('general:error'));
      return helpEmbed;
    }

    let permissionsBotString = '';
    const bot = guildData.guild.members.me;

    command.bot_permissions.forEach(function (value: PermissionResolvable) {
      if (bot.permissions.has(value)) {
        permissionsBotString += '✅';
      } else {
        permissionsBotString += '❌';
      }
      permissionsBotString += '  ' + convertPermissionsToLocaleString(value) + '\n';
    });

    helpEmbed.addFields({
      name: `🤖 ${i18next.t('commands:help_permissions_for_bot')}`,
      value: permissionsBotString || i18next.t('commands:help_permissions_not_required'),
      inline: true
    });

    let permissionsMemberString = i18next.t('commands:help_permissions_not_required');

    if (command.user_permissions) {
      permissionsMemberString = '';
      command.user_permissions.forEach(function (value: PermissionResolvable) {
        if (guildData.member.permissions.has(value)) {
          permissionsMemberString += '✅';
        } else {
          permissionsMemberString += '❌';
        }
        permissionsMemberString += '  ' + convertPermissionsToLocaleString(value) + '\n';
      });
    }

    helpEmbed.addFields({
      name: `🐸 ${i18next.t('commands:help_permissions_for_user')}`,
      value: permissionsMemberString,
      inline: true
    });
  }

  return helpEmbed;
}

export async function generateCommandsEmbedList(client: Client, guild: Guild | null): Promise<EmbedBuilder> {
  let guildPrefix: string | undefined = undefined;
  if (guild) guildPrefix = await getGuildOptionPrefix(guild.id);

  const helpEmbed = new EmbedBuilder().setColor('#436df7').setTitle(i18next.t('commands:help_about_commands'))
    .setDescription(`
    ${i18next.t('commands:help_embed_description', { prefix: ENV.BOT_COMMAND_PREFIX, interpolation: { escapeValue: false } })} ${guildPrefix ? i18next.t('commands:help_embed_description_server_prefix', { prefix: guildPrefix, interpolation: { escapeValue: false } }) : ''}
    \n
    GitHub: https://github.com/AlexInCube/AlCoTest
    `);

  client.commandsGroups.forEach((group) => {
    let commandsList = '';
    group.commands.forEach((command: ICommand) => {
      if (command.hidden) return;
      commandsList += `\`${command.text_data.name}\`, `;
    });
    helpEmbed.addFields({
      name: group.icon_emoji + ' ' + convertGroupToLocaleString(group),
      value: commandsList.slice(0, -2),
      inline: false
    });
  });

  return helpEmbed;
}

function convertGroupToLocaleString(group: ICommandGroup): string {
  return i18next.t(`commandsGroups:${group.name}`);
}

function convertPermissionsToLocaleString(permission: PermissionResolvable): string {
  switch (permission) {
    case PermissionsBitField.Flags.Administrator:
      return i18next.t('permissions:Administrator');
    case PermissionsBitField.Flags.SendMessages:
      return i18next.t('permissions:SendMessages');
    case PermissionsBitField.Flags.ManageMessages:
      return i18next.t('permissions:ManageMessages');
    case PermissionsBitField.Flags.Connect:
      return i18next.t('permissions:Connect');
    case PermissionsBitField.Flags.Speak:
      return i18next.t('permissions:Speak');
    case PermissionsBitField.Flags.ViewChannel:
      return i18next.t('permissions:ViewChannel');
    case PermissionsBitField.Flags.AttachFiles:
      return i18next.t('permissions:AttachFiles');
    case PermissionsBitField.Flags.ViewAuditLog:
      return i18next.t('permissions:ViewAuditLog');
    default:
      return `${i18next.t('permissions:notFound')}: ` + permission;
  }
}
