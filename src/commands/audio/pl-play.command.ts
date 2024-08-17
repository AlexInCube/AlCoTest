import { CommandArgument, ICommand } from '../../CommandTypes.js';
import { GroupAudio } from './AudioTypes.js';
import { Message, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import i18next from 'i18next';

export default function (): ICommand {
  return {
    text_data: {
      name: 'pl-play',
      description: i18next.t('commands:pl-play_desc'),
      arguments: [new CommandArgument(i18next.t('commands:pl-play_arg'), true)],
      execute: async (message: Message) => {}
    },
    slash_data: {
      slash_builder: new SlashCommandBuilder()
        .setName('pl-play')
        .setDescription(i18next.t('commands:pl-play_desc'))
        .addStringOption((option) =>
          option
            .setName('request')
            .setDescription(i18next.t('commands:pl-play_arg'))
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
    bot_permissions: [
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.Connect,
      PermissionsBitField.Flags.ViewChannel,
      PermissionsBitField.Flags.Speak,
      PermissionsBitField.Flags.ManageMessages
    ]
  };
}
