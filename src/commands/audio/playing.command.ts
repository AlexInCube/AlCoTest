import { ICommand } from '../../CommandTypes.js';
import { EmbedBuilder, Guild, Message, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import { GroupAudio } from './AudioTypes.js';
import {
  AudioCommandWrapperInteraction,
  AudioCommandWrapperText
} from '../../audioplayer/util/AudioCommandWrappers.js';
import { splitBar } from '../../utilities/splitBar.js';
import i18next from 'i18next';
import { Track } from 'riffy';
import { formatMilliseconds } from '../../utilities/formatMillisecondsToTime.js';

export default function (): ICommand {
  return {
    text_data: {
      name: 'playing',
      description: i18next.t('commands:playing_desc'),
      execute: async (message: Message) => {
        await AudioCommandWrapperText(message, async () => {
          await message.reply({ embeds: [generatePlayingMessage(message.guild!)] });
        });
      }
    },
    slash_data: {
      slash_builder: new SlashCommandBuilder().setName('playing').setDescription(i18next.t('commands:playing_desc')),
      execute: async (interaction) => {
        await AudioCommandWrapperInteraction(interaction, async () => {
          await interaction.reply({
            embeds: [generatePlayingMessage(interaction.guild!)],
            ephemeral: true
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

export function generatePlayingMessage(guild: Guild): EmbedBuilder {
  const riffyPlayer = guild.client.audioPlayer.riffy.get(guild.id);
  const embed = new EmbedBuilder().setColor('#4F51FF');

  if (riffyPlayer) {
    const track = riffyPlayer.current;
    embed.setTitle(track.info.title);
    embed.setURL(track.info.uri);
    embed.setAuthor({ name: `${i18next.t('commands:playing_now_playing')}:` });
    embed.addFields({
      name: i18next.t('commands:playing_song_length'),
      value: generateTimeline(track, riffyPlayer.position, track.info.length),
      inline: true
    });
  } else {
    embed.setColor('#FF0022');
    embed.setTitle(i18next.t('commands:playing_player_is_empty'));
  }

  return embed;
}

export function generateTimeline(track: Track, currentMs: number, maxMs: number): string {
  let durationValue: string;

  if (track.info.stream) {
    durationValue = `\`${i18next.t('commands:playing_timeline_stream')}\``;
  } else {
    durationValue = `|${splitBar(maxMs, Math.max(currentMs, 1), 25, undefined, '🔷')[0]}|\n\`[${formatMilliseconds(currentMs)}/${formatMilliseconds(maxMs)}]\``;
  }

  return durationValue;
}
