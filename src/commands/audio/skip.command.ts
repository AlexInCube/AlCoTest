import { ICommand } from '../../CommandTypes.js';
import { GuildMember, Message, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import { GroupAudio } from './AudioTypes.js';
import {
  AudioCommandWrapperInteraction,
  AudioCommandWrapperText
} from './util/AudioCommandWrappers.js';
import { Song } from 'distube';
import i18next from 'i18next';

export default function (): ICommand {
  return {
    text_data: {
      name: 'skip',
      description: i18next.t('commands:skip_desc'),
      execute: async (message: Message) => {
        await AudioCommandWrapperText(message, async () => {
          const song = await message.client.audioPlayer.skip(message.guild!);
          if (song) {
            await message.reply({ content: generateSkipMessage(song, message.member!) });
          } else {
            await message.reply({ content: generateSkipMessageFailure() });
          }
        });
      }
    },
    slash_data: {
      slash_builder: new SlashCommandBuilder()
        .setName('skip')
        .setDescription(i18next.t('commands:skip_desc')),
      execute: async (interaction) => {
        await AudioCommandWrapperInteraction(interaction, async () => {
          const song = await interaction.client.audioPlayer.skip(interaction.guild!);
          if (song) {
            await interaction.reply({
              content: generateSkipMessage(song, interaction.member as GuildMember)
            });
          } else {
            await interaction.reply({ content: generateSkipMessageFailure(), ephemeral: true });
          }
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

export function generateSkipMessage(song: Song, member: GuildMember): string {
  return `:fast_forward: ${member} ${i18next.t('commands:skip_success')} ${song.name} - ${song.uploader.name} :fast_forward:`;
}

export function generateSkipMessageFailure(): string {
  return i18next.t('commands:skip_failure');
}
