import { CommandArgument, ICommand } from '../../CommandTypes.js';
import { GroupAudio } from './AudioTypes.js';
import { Message, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import i18next from 'i18next';

export default function (): ICommand {
  return {
    text_data: {
      name: 'pl-delete',
      description: i18next.t('commands:pl-delete_desc'),
      arguments: [new CommandArgument(i18next.t('commands:pl-delete_link'), true)],
      execute: async (message: Message) => {}
    },
    slash_data: {
      slash_builder: new SlashCommandBuilder()
        .setName('pl-delete')
        .setDescription(i18next.t('commands:pl-delete_desc'))
        .addStringOption((option) =>
          option
            .setName('request')
            .setDescription(i18next.t('commands:pl-delete_link'))
            .setAutocomplete(true)
            .setRequired(true)
        ),
      execute: async (interaction) => {}
    },
    group: GroupAudio,
    guild_data: {
      guild_only: true,
      voice_required: true
    },
    bot_permissions: [PermissionsBitField.Flags.SendMessages]
  };
}
