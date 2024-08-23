import { ICommand } from '../../CommandTypes.js';
import { EmbedBuilder, GuildMember, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import { GroupAudio } from './AudioTypes.js';
import {
  AudioCommandWrapperInteraction,
  AudioCommandWrapperText
} from '../../audioplayer/util/AudioCommandWrappers.js';
import { Song } from 'distube';
import i18next from 'i18next';
import { generateSimpleEmbed } from '../../utilities/generateSimpleEmbed.js';

export default function (): ICommand {
  return {
    text_data: {
      name: 'previous',
      description: i18next.t('commands:previous_desc'),
      execute: async (message) => {
        await AudioCommandWrapperText(message, async () => {
          const song = await message.client.audioPlayer.previous(message.guild!);
          if (song) {
            await message.reply({
              embeds: [generateEmbedAudioPlayerPrevious(message.member as GuildMember, song)]
            });
          } else {
            await message.reply({ embeds: [generateEmbedAudioPlayerPreviousFailure()] });
          }
        });
      }
    },
    slash_data: {
      slash_builder: new SlashCommandBuilder().setName('previous').setDescription(i18next.t('commands:previous_desc')),
      execute: async (interaction) => {
        await AudioCommandWrapperInteraction(interaction, async () => {
          const song = await interaction.client.audioPlayer.previous(interaction.guild!);
          if (song) {
            await interaction.reply({
              embeds: [generateEmbedAudioPlayerPrevious(interaction.member as GuildMember, song)]
            });
          } else {
            await interaction.reply({
              embeds: [generateEmbedAudioPlayerPreviousFailure()],
              ephemeral: true
            });
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

export function generateEmbedAudioPlayerPrevious(member: GuildMember, song: Song): EmbedBuilder {
  return generateSimpleEmbed(
    `:rewind: ${member} ${i18next.t('commands:previous_success')} ${song.name} - ${song.uploader.name} :rewind:`
  );
}

export function generateEmbedAudioPlayerPreviousFailure() {
  return generateSimpleEmbed(i18next.t('commands:previous_error_song_not_exists'));
}
