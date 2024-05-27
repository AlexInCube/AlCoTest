import { ICommand } from '../../CommandTypes.js';
import { GuildMember, Message, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import { GroupAudio } from './AudioTypes.js';
import {
  AudioCommandWrapperInteraction,
  AudioCommandWrapperText
} from './util/AudioCommandWrappers.js';
import i18next from 'i18next';
export default function (): ICommand {
  return {
    text_data: {
      name: 'shuffle',
      description: i18next.t('commands:shuffle_desc'),
      execute: async (message: Message): Promise<void> => {
        await AudioCommandWrapperText(message, async (): Promise<void> => {
          if (await message.client.audioPlayer.shuffle(message.guild!)) {
            await message.reply({ content: generateMessageAudioPlayerShuffle(message.member!) });
          } else {
            await message.reply(generateMessageAudioPlayerShuffleFailure());
          }
        });
      }
    },
    slash_data: {
      slash_builder: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription(i18next.t('commands:shuffle_desc')),
      execute: async (interaction): Promise<void> => {
        await AudioCommandWrapperInteraction(interaction, async (): Promise<void> => {
          if (await interaction.client.audioPlayer.shuffle(interaction.guild!)) {
            await interaction.reply({
              content: generateMessageAudioPlayerShuffle(interaction.member as GuildMember)
            });
          } else {
            await interaction.reply(generateMessageAudioPlayerShuffleFailure());
          }
        });
      }
    },
    group: GroupAudio,
    guild_data: {
      guild_only: true,
      voice_required: true,
      voice_with_bot_only: true
    },
    bot_permissions: [PermissionsBitField.Flags.SendMessages]
  };
}

export function generateMessageAudioPlayerShuffle(member: GuildMember): string {
  return `${member} ${i18next.t('commands:shuffle_success')}`;
}

export function generateMessageAudioPlayerShuffleFailure(): string {
  return i18next.t('commands:shuffle_failure');
}
