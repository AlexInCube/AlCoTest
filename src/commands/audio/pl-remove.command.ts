import { CommandArgument, ICommand } from '../../CommandTypes.js';
import { GroupAudio } from './AudioTypes.js';
import { ChatInputCommandInteraction, Message, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import i18next from 'i18next';
import { UserPlaylistNamesAutocomplete, UserPlaylistRemoveSong } from '../../schemas/SchemaPlaylist.js';
import { generateSimpleEmbed } from '../../utilities/generateSimpleEmbed.js';
import { generateErrorEmbed } from '../../utilities/generateErrorEmbed.js';
import { ENV } from '../../EnvironmentVariables.js';
import { loggerError } from '../../utilities/logger.js';

export default function (): ICommand {
  return {
    text_data: {
      name: 'pl-remove',
      description: i18next.t('commands:pl-remove_desc'),
      arguments: [
        new CommandArgument(i18next.t('commands:pl_arg_name'), true),
        new CommandArgument(i18next.t('commands:pl_arg_song_id'), true)
      ],
      execute: async (message: Message, args: Array<string>) => {
        // With this we modify "args" to extract songID and remain only words for playlist name
        const songID = Number(args.pop());
        // Join all words, when there is no song id
        const playlistName = args.join(' ');

        await plRemoveAndReply(playlistName, songID, message, message.author.id);
      }
    },
    slash_data: {
      slash_builder: new SlashCommandBuilder()
        .setName('pl-remove')
        .setDescription(i18next.t('commands:pl-remove_desc'))
        .addStringOption((option) =>
          option
            .setName('playlist_name')
            .setDescription(i18next.t('commands:pl_arg_name'))
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addNumberOption((option) =>
          option.setName('song_id').setDescription(i18next.t('commands:pl_arg_song_id')).setRequired(true)
        ),
      execute: async (interaction) => {
        const songID = interaction.options.getNumber('song_id')! - 1;
        const playlistName = interaction.options.getString('playlist_name')!;

        await plRemoveAndReply(playlistName, songID, interaction, interaction.user.id);
      },
      autocomplete: UserPlaylistNamesAutocomplete
    },
    group: GroupAudio,
    bot_permissions: [PermissionsBitField.Flags.SendMessages]
  };
}

async function plRemoveAndReply(
  playlistName: string,
  songID: number,
  ctx: Message | ChatInputCommandInteraction,
  userID: string
) {
  try {
    const playlistSong = await UserPlaylistRemoveSong(userID, playlistName, Number(songID));

    await ctx.reply({
      embeds: [
        generateSimpleEmbed(
          i18next.t('commands:pl-remove_success', {
            song: playlistSong.name,
            playlist: playlistName,
            interpolation: { escapeValue: false }
          })
        )
      ],
      ephemeral: true
    });
  } catch (e) {
    await ctx.reply({
      embeds: [generateErrorEmbed(i18next.t('commands:pl-remove_error_unknown'))],
      ephemeral: true
    });
    if (ENV.BOT_VERBOSE_LOGGING) loggerError(e);
  }
}
