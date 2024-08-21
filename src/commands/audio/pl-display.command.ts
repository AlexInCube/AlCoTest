import { CommandArgument, ICommand, ICommandContext } from '../../CommandTypes.js';
import { GroupAudio } from './AudioTypes.js';
import { EmbedBuilder, Message, PermissionsBitField, SlashCommandBuilder, User } from 'discord.js';
import i18next from 'i18next';
import {
  PlaylistNameMaxLength,
  PlaylistNameMinLength,
  UserPlaylistGet,
  UserPlaylistNamesAutocomplete
} from '../../schemas/SchemaPlaylist.js';
import { generateErrorEmbed } from '../../utilities/generateErrorEmbed.js';

export default function (): ICommand {
  return {
    text_data: {
      name: 'pl-display',
      description: i18next.t('commands:pl-display_desc'),
      arguments: [new CommandArgument(i18next.t('commands:pl_arg_name'), true)],
      execute: async (message: Message, args: Array<string>) => {
        const playlistName = args[0];

        await plDisplayAndReply(playlistName, message, message.author);
      }
    },
    slash_data: {
      slash_builder: new SlashCommandBuilder()
        .setName('pl-display')
        .setDescription(i18next.t('commands:pl-display_desc'))
        .addStringOption((option) =>
          option
            .setName('playlist_name')
            .setDescription(i18next.t('commands:pl_arg_name'))
            .setRequired(true)
            .setAutocomplete(true)
            .setMinLength(PlaylistNameMinLength)
            .setMaxLength(PlaylistNameMaxLength)
        ),
      execute: async (interaction) => {
        const playlistName = interaction.options.getString('playlist_name')!;

        await plDisplayAndReply(playlistName, interaction, interaction.user);
      },
      autocomplete: UserPlaylistNamesAutocomplete
    },
    group: GroupAudio,
    bot_permissions: [PermissionsBitField.Flags.SendMessages]
  };
}

async function plDisplayAndReply(playlistName: string, ctx: ICommandContext, user: User) {
  const playlist = await UserPlaylistGet(user.id, playlistName, true);

  if (!playlist) {
    await ctx.reply({
      embeds: [generateErrorEmbed(i18next.t('commands:pl_error_playlist_not_exists'))],
      ephemeral: true
    });
    return;
  }

  const playlistEmbed = new EmbedBuilder().setAuthor({ name: user.displayName, iconURL: user.displayAvatarURL() });

  let songs = ``;

  playlist.songs.forEach((song, index) => {
    const songDate = song.createdAt ? `<t:${Math.round(song.createdAt.getTime() / 1000)}:f>` : '<t:0:f>';

    songs += `${index + 1}. [${song.name}](${song.url}) - ${songDate} \n`;
  });

  if (songs === '') {
    playlistEmbed.setDescription(i18next.t('commands:pl-display_embed_no_songs'));
  } else {
    playlistEmbed.setDescription(songs);
  }

  await ctx.reply({ embeds: [playlistEmbed], ephemeral: true });
}
