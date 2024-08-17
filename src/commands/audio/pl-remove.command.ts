import { CommandArgument, ICommand } from '../../CommandTypes.js';
import { GroupAudio } from './AudioTypes.js';
import { Message, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import i18next from 'i18next';
import { UserPlaylistNamesAutocomplete } from '../../schemas/SchemaPlaylist.js';

export default function (): ICommand {
  return {
    text_data: {
      name: 'pl-remove',
      description: i18next.t('commands:pl-remove_desc'),
      arguments: [new CommandArgument(i18next.t('commands:pl-remove_link'), true)],
      execute: async (message: Message) => {}
    },
    slash_data: {
      slash_builder: new SlashCommandBuilder()
        .setName('pl-remove')
        .setDescription(i18next.t('commands:pl-remove_desc'))
        .addStringOption((option) =>
          option
            .setName('playlist_name')
            .setDescription(i18next.t('commands:pl-remove_link'))
            .setAutocomplete(true)
            .setRequired(true)
        ),
      execute: async (interaction) => {},
      autocomplete: UserPlaylistNamesAutocomplete
    },
    group: GroupAudio,
    guild_data: {
      guild_only: true,
      voice_required: true
    },
    bot_permissions: [PermissionsBitField.Flags.SendMessages]
  };
}
