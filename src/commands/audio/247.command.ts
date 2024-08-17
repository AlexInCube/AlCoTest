import { ICommand } from '../../CommandTypes.js';
import { Guild, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import { GroupAudio } from './AudioTypes.js';
import i18next from 'i18next';
import { getGuildOptionLeaveOnEmpty } from '../../schemas/SchemaGuild.js';
import { generateSimpleEmbed } from '../../utilities/generateSimpleEmbed.js';

export default function (): ICommand {
  return {
    slash_data: {
      slash_builder: new SlashCommandBuilder().setName('247').setDescription(i18next.t('commands:247_desc')),
      execute: async (interaction) => {
        const newMode = await toggleLeaveOnEmpty(interaction.guild as Guild);
        await interaction.reply({ embeds: [generateToggleLeaveOnEmptyEmbed(newMode)] });
      }
    },
    text_data: {
      name: '247',
      description: i18next.t('commands:247_desc'),
      execute: async (message) => {
        const newMode = await toggleLeaveOnEmpty(message.guild as Guild);
        await message.reply({ embeds: [generateToggleLeaveOnEmptyEmbed(newMode)] });
      }
    },
    guild_data: {
      guild_only: true
    },
    group: GroupAudio,
    bot_permissions: [PermissionsBitField.Flags.SendMessages],
    user_permissions: [PermissionsBitField.Flags.ManageGuild]
  };
}

function generateToggleLeaveOnEmptyEmbed(newMode: boolean) {
  return generateSimpleEmbed(`${newMode ? i18next.t('commands:247_disabled') : i18next.t('commands:247_enabled')}`);
}

async function toggleLeaveOnEmpty(guild: Guild) {
  const currentLeaveOnEmptyMode = await getGuildOptionLeaveOnEmpty(guild.id);

  const newMode = !currentLeaveOnEmptyMode;

  await guild.client.audioPlayer.setLeaveOnEmpty(guild, newMode);

  return newMode;
}
