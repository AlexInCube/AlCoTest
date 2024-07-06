import { CommandArgument, ICommand } from '../../CommandTypes.js';
import { EmbedBuilder, GuildMember, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import { GroupAudio } from './AudioTypes.js';
import {
  AudioCommandWrapperInteraction,
  AudioCommandWrapperText
} from '../../audioplayer/util/AudioCommandWrappers.js';
import { formatSecondsToTime } from '../../utilities/formatSecondsToTime.js';
import i18next from 'i18next';
import { generateSimpleEmbed } from '../../utilities/generateSimpleEmbed.js';

export default function (): ICommand {
  return {
    text_data: {
      name: 'rewind',
      description: i18next.t('commands:rewind_desc'),
      arguments: [new CommandArgument(i18next.t('commands:rewind_arg_time'), true)],
      execute: async (message, args) => {
        const time = hmsToSeconds(args[0]);

        await AudioCommandWrapperText(message, async () => {
          if (time) {
            if (await message.client.audioPlayer.rewind(message.guild!, time)) {
              await message.reply({
                embeds: [generateEmbedAudioPlayerRewind(message.member!, time)]
              });
            }
          } else {
            await message.reply({ embeds: [generateEmbedAudioPlayerRewindFailure()] });
          }
        });
      }
    },
    slash_data: {
      slash_builder: new SlashCommandBuilder()
        .setName('rewind')
        .setDescription(i18next.t('commands:rewind_desc'))
        .addStringOption((option) =>
          option
            .setName('time')
            .setDescription(i18next.t('commands:rewind_arg_time'))
            .setNameLocalizations({
              ru: 'время'
            })
            .setRequired(true)
        ),
      execute: async (interaction) => {
        const time = hmsToSeconds(interaction.options.getString('time')!);

        await AudioCommandWrapperInteraction(interaction, async () => {
          if (time) {
            if (await interaction.client.audioPlayer.rewind(interaction.guild!, time)) {
              await interaction.reply({
                embeds: [generateEmbedAudioPlayerRewind(interaction.member as GuildMember, time)]
              });
            }
          } else {
            await interaction.reply({
              embeds: [generateEmbedAudioPlayerRewindFailure()],
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

function hmsToSeconds(str: string): number | undefined {
  const p = str.split(':');
  let s = 0;
  let m = 1;

  if (p.length > 3) return undefined;

  try {
    while (p.length > 0) {
      s += m * parseInt(p.pop() as string, 10);
      m *= 60;
    }
  } catch (e) {
    return undefined;
  }

  if (s < 0) s = 0;

  return s;
}

export function generateEmbedAudioPlayerRewind(member: GuildMember, time: number): EmbedBuilder {
  return generateSimpleEmbed(
    `${member} ${i18next.t('commands:rewind_success')} ${formatSecondsToTime(time)}`
  );
}

export function generateEmbedAudioPlayerRewindFailure(): EmbedBuilder {
  return generateSimpleEmbed(i18next.t('commands:rewind_failure'));
}
