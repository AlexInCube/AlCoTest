import { ICommand } from '../../CommandTypes.js';
import {
  EmbedBuilder,
  GuildMember,
  Message,
  PermissionsBitField,
  SlashCommandBuilder
} from 'discord.js';
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
      name: 'skip',
      description: i18next.t('commands:skip_desc'),
      execute: async (message: Message) => {
        await AudioCommandWrapperText(message, async () => {
          const song = await message.client.audioPlayer.skip(message.guild!);
          if (song) {
            await message.reply({ embeds: [generateSkipEmbed(song, message.member!)] });
          } else {
            await message.reply({ embeds: [generateSkipEmbedFailure()] });
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
              embeds: [generateSkipEmbed(song, interaction.member as GuildMember)]
            });
          } else {
            await interaction.reply({ embeds: [generateSkipEmbedFailure()], ephemeral: true });
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

export function generateSkipEmbed(song: Song, member: GuildMember): EmbedBuilder {
  return generateSimpleEmbed(
    `:fast_forward: ${member} ${i18next.t('commands:skip_success')} ${song.name} - ${song.uploader.name} :fast_forward:`
  );
}

export function generateSkipEmbedFailure(): EmbedBuilder {
  return generateSimpleEmbed(i18next.t('commands:skip_failure'));
}
