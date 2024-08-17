import { CommandArgument, ICommand } from '../../CommandTypes.js';
import { GroupAudio } from './AudioTypes.js';
import { Message, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import i18next from 'i18next';
import {
  PlaylistNameMaxLength,
  PlaylistNameMinLength,
  UserPlaylistNamesAutocomplete
} from '../../schemas/SchemaPlaylist.js';

export default function (): ICommand {
  return {
    text_data: {
      name: 'pl-display',
      description: i18next.t('commands:pl-display_desc'),
      arguments: [new CommandArgument(i18next.t('commands:pl_arg_name'), true)],
      execute: async (message: Message) => {}
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
      execute: async (interaction) => {},
      autocomplete: UserPlaylistNamesAutocomplete
    },
    group: GroupAudio,
    bot_permissions: [PermissionsBitField.Flags.SendMessages]
  };
}
