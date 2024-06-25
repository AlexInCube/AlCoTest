import { CommandArgument, ICommand } from '../../CommandTypes.js';
import { GuildMember, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import { GroupAudio } from './AudioTypes.js';
import {
  AudioCommandWrapperInteraction,
  AudioCommandWrapperText
} from '../audioPlayer/util/AudioCommandWrappers.js';
import { generateErrorEmbed } from '../../utilities/generateErrorEmbed.js';
import { Song } from 'distube';
import i18next from 'i18next';

export default function (): ICommand {
  return {
    text_data: {
      name: 'jump',
      description: i18next.t('commands:jump_desc'),
      arguments: [new CommandArgument(i18next.t('commands:jump_arg_position'), true)],
      execute: async (message, args) => {
        let pos = 0;
        try {
          pos = parseInt(args[0]) - 1;
          if (pos < 1) {
            return;
          }
        } catch (e) {
          await message.reply({
            embeds: [generateErrorEmbed(i18next.t('commands:jump_is_not_number'))]
          });
          return;
        }

        await AudioCommandWrapperText(message, async () => {
          const song = await message.client.audioPlayer.jump(message.guild!, pos!);
          if (song) {
            await message.reply(generateMessageAudioPlayerJump(message.member!, song));
          } else {
            await message.reply(generateMessageAudioPlayerJumpFailure());
          }
        });
      }
    },
    slash_data: {
      slash_builder: new SlashCommandBuilder()
        .setName('jump')
        .setDescription(i18next.t('commands:jump_desc'))
        .addNumberOption((option) =>
          option
            .setName('position')
            .setDescription(i18next.t('commands:jump_arg_position'))
            .setRequired(true)
        ),
      execute: async (interaction) => {
        const pos = interaction.options.getNumber('position')! - 1;

        if (pos < 1) {
          return;
        }

        await AudioCommandWrapperInteraction(interaction, async () => {
          const song = await interaction.client.audioPlayer.jump(interaction.guild!, pos!);
          if (song) {
            await interaction.reply(
              generateMessageAudioPlayerJump(interaction.member as GuildMember, song)
            );
          } else {
            await interaction.reply(generateMessageAudioPlayerJumpFailure());
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

function generateMessageAudioPlayerJump(member: GuildMember, song: Song) {
  return `:fast_forward: ${member} ${i18next.t('commands:jump_success')} ${song.name} :fast_forward:`;
}

function generateMessageAudioPlayerJumpFailure() {
  return i18next.t('commands:jump_failure');
}
