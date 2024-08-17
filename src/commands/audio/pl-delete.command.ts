import { CommandArgument, ICommand } from '../../CommandTypes.js';
import { GroupAudio } from './AudioTypes.js';
import { ChatInputCommandInteraction, Message, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import i18next from 'i18next';
import {
  PlaylistIsNotExists,
  UserPlaylistDelete,
  UserPlaylistNamesAutocomplete
} from '../../schemas/SchemaPlaylist.js';
import { generateSimpleEmbed } from '../../utilities/generateSimpleEmbed.js';
import { generateErrorEmbed } from '../../utilities/generateErrorEmbed.js';
import { ENV } from '../../EnvironmentVariables.js';
import { loggerError } from '../../utilities/logger.js';

export default function (): ICommand {
  return {
    text_data: {
      name: 'pl-delete',
      description: i18next.t('commands:pl-delete_desc'),
      arguments: [new CommandArgument(i18next.t('commands:pl_arg_name'), true)],
      execute: async (message: Message, args: Array<string>) => {
        const playlistsName = args[0];

        await plDeleteAndReply(message, message.author.id, playlistsName);
      }
    },
    slash_data: {
      slash_builder: new SlashCommandBuilder()
        .setName('pl-delete')
        .setDescription(i18next.t('commands:pl-delete_desc'))
        .addStringOption((option) =>
          option
            .setName('playlist_name')
            .setDescription(i18next.t('commands:pl_arg_name'))
            .setAutocomplete(true)
            .setRequired(true)
        ),
      execute: async (interaction) => {
        const playlistsName = interaction.options.getString('playlist_name')!;

        await plDeleteAndReply(interaction, interaction.user.id, playlistsName);
      },
      autocomplete: UserPlaylistNamesAutocomplete
    },
    group: GroupAudio,
    bot_permissions: [PermissionsBitField.Flags.SendMessages]
  };
}

async function plDeleteAndReply(ctx: Message | ChatInputCommandInteraction, userID: string, playlistName: string) {
  try {
    await UserPlaylistDelete(userID, playlistName);

    await ctx.reply({
      embeds: [generateSimpleEmbed(i18next.t('commands:pl-delete_embed_deleted', { name: playlistName }))],
      ephemeral: true
    });
  } catch (e) {
    if (e instanceof PlaylistIsNotExists) {
      await ctx.reply({
        embeds: [
          generateErrorEmbed(
            i18next.t('commands:pl_error_playlist_not_exists', {
              name: playlistName,
              interpolation: { escapeValue: false }
            })
          )
        ],
        ephemeral: true
      });
    }

    await ctx.reply({ embeds: [generateErrorEmbed(i18next.t('commands:pl-delete_error'))], ephemeral: true });
    if (ENV.BOT_VERBOSE_LOGGING) loggerError(e);
  }
}
