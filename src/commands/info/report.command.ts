import { ICommand } from '../../CommandTypes.js';
import {
  ChatInputCommandInteraction,
  Message,
  PermissionsBitField,
  SlashCommandBuilder
} from 'discord.js';
import { GroupInfo } from './InfoTypes.js';
import i18next from 'i18next';
import { generateSimpleEmbed } from '../../utilities/generateSimpleEmbed.js';

export default function (): ICommand {
  return {
    text_data: {
      name: 'report',
      description: i18next.t('commands:report_desc'),
      execute: async (message: Message) => {
        await message.reply({ embeds: [generateReportEmbed()] });
      }
    },
    slash_data: {
      slash_builder: new SlashCommandBuilder()
        .setName('report')
        .setDescription(i18next.t('commands:report_desc')),
      execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.reply({ embeds: [generateReportEmbed()], ephemeral: true });
      }
    },
    group: GroupInfo,
    bot_permissions: [PermissionsBitField.Flags.SendMessages]
  };
}

function generateReportEmbed() {
  return generateSimpleEmbed(
    i18next.t('commands:report_message', {
      issueLink: 'https://github.com/AlexInCube/AlCoTest/issues/new/choose',
      discussionLink: 'https://github.com/AlexInCube/AlCoTest/discussions/new?category=q-a',
      interpolation: { escapeValue: false }
    })
  );
}
