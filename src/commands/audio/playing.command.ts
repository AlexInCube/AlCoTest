import { ICommand } from '../../CommandTypes.js';
import { EmbedBuilder, Guild, Message, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import { GroupAudio } from './AudioTypes.js';
import {
  AudioCommandWrapperInteraction,
  AudioCommandWrapperText
} from '../audioPlayer/util/AudioCommandWrappers.js';
import { splitBar } from '../../utilities/splitBar.js';
import { Queue } from 'distube';
import i18next from 'i18next';

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
      slash_builder: new SlashCommandBuilder()
        .setName('playing')
        .setDescription(i18next.t('commands:playing_desc')),
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
  const queue = guild.client.audioPlayer.distube.getQueue(guild);
  const embed = new EmbedBuilder().setColor('#4F51FF');

  if (queue) {
    const song = queue.songs[0];
    embed.setTitle(song.name!);
    embed.setURL(song.url!);
    embed.setAuthor({ name: `${i18next.t('commands:playing_now_playing')}:` });
    embed.addFields({
      name: i18next.t('commands:playing_song_length'),
      value: generateTimeline(queue),
      inline: true
    });
  } else {
    embed.setColor('#FF0022');
    embed.setTitle(i18next.t('commands:playing_player_is_empty'));
  }

  return embed;
}

export function generateTimeline(queue: Queue): string {
  const song = queue.songs[0];
  let durationValue: string;

  if (song.isLive) {
    durationValue = `\`${i18next.t('commands:playing_timeline_stream')} [${queue.formattedCurrentTime}]\``;
  } else {
    durationValue = `|${splitBar(song.duration, Math.max(queue.currentTime, 1), 25, undefined, '🔷')[0]}|\n\`[${queue.formattedCurrentTime}/${song.formattedDuration}]\``;
  }

  return durationValue;
}
