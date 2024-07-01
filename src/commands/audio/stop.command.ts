import { ICommand } from '../../CommandTypes.js';
import { GuildMember, Message, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import { GroupAudio } from './AudioTypes.js';
import {
  AudioCommandWrapperInteraction,
  AudioCommandWrapperText
} from '../../audioplayer/util/AudioCommandWrappers.js';
import i18next from 'i18next';

export default function (): ICommand {
  return {
    text_data: {
      name: 'stop',
      description: i18next.t('commands:stop_desc'),
      execute: async (message: Message) => {
        await AudioCommandWrapperText(message, async () => {
          await message.client.audioPlayer.stop(message.guild!);
          await message.reply({ content: generateMessageAudioPlayerStop(message.member!) });
        });
      }
    },
    slash_data: {
      slash_builder: new SlashCommandBuilder()
        .setName('stop')
        .setDescription(i18next.t('commands:stop_desc')),
      execute: async (interaction) => {
        await AudioCommandWrapperInteraction(interaction, async () => {
          await interaction.client.audioPlayer.stop(interaction.guild!);
          await interaction.reply({
            content: generateMessageAudioPlayerStop(interaction.member as GuildMember)
          });
        });
      }
    },
    guild_data: {
      guild_only: true,
      voice_required: true,
      voice_with_bot_only: true
    },
    group: GroupAudio,
    bot_permissions: [PermissionsBitField.Flags.SendMessages]
  };
}

export function generateMessageAudioPlayerStop(member: GuildMember): string {
  return `${member} ${i18next.t('commands:stop_success')}`;
}
