import { CommandArgument, ICommand } from '../../CommandTypes.js';
import {
  ApplicationCommandOptionChoiceData,
  AutocompleteInteraction,
  Guild,
  GuildMember,
  Message,
  PermissionsBitField,
  SlashCommandBuilder,
  TextChannel,
  VoiceBasedChannel,
  VoiceChannel
} from 'discord.js';
import { GroupAudio } from './AudioTypes.js';
import { truncateString } from '../../utilities/truncateString.js';
import i18next from 'i18next';
import { SearchResultType } from '@distube/youtube';
import ytsr from '@distube/ytsr';
import { generateWarningEmbed } from '../../utilities/generateWarningEmbed.js';
import { ENV } from '../../EnvironmentVariables.js';
import { queueSongsIsFull } from '../../audioplayer/util/queueSongsIsFull.js';

export const services = 'Youtube, Spotify, Soundcloud, Yandex Music, Apple Music, HTTP-stream';
export default function (): ICommand {
  return {
    text_data: {
      name: 'play',
      description: i18next.t('commands:play_desc'),
      arguments: [
        new CommandArgument(i18next.t('commands:play_arg_link', { services: services }), true)
      ],
      execute: async (message: Message, args: string[]) => {
        // Play command accept only one arg is a query string.
        // In text command system we need to merge all words for request in one string
        const songQuery = args.join(' ');

        const member = message.member as GuildMember;
        const channel = message.channel as TextChannel;

        if (queueSongsIsFull(message.client, message.guild as Guild)) {
          await message.reply({
            embeds: [
              generateWarningEmbed(
                i18next.t('commands:play_error_songs_limit', {
                  queueLimit: ENV.BOT_MAX_SONGS_IN_QUEUE
                }) as string
              )
            ]
          });
          return;
        }

        await message.client.audioPlayer.play(
          member.voice.channel as VoiceBasedChannel,
          channel,
          songQuery,
          {
            member: member,
            textChannel: channel
          }
        );

        await message.delete();
      }
    },
    slash_data: {
      slash_builder: new SlashCommandBuilder()
        .setName('play')
        .setDescription(i18next.t('commands:play_desc'))
        .addStringOption((option) =>
          option
            .setName('request')
            .setDescription(i18next.t('commands:play_arg_link', { services: services }))
            .setAutocomplete(true)
            .setRequired(true)
        ),
      autocomplete: songSearchAutocomplete,
      execute: async (interaction) => {
        if (queueSongsIsFull(interaction.client, interaction.guild as Guild)) {
          await interaction.reply({
            embeds: [
              generateWarningEmbed(
                i18next.t('commands:play_error_songs_limit', {
                  queueLimit: ENV.BOT_MAX_SONGS_IN_QUEUE
                }) as string
              )
            ],
            ephemeral: true
          });
          return;
        }

        const songQuery = interaction.options.getString('request');

        await interaction.reply({
          content: i18next.t('general:thinking') as string
        });
        await interaction.deleteReply();

        const member = interaction.member as GuildMember;

        if (songQuery) {
          await interaction.client.audioPlayer.play(
            member.voice.channel as VoiceChannel,
            interaction.channel as TextChannel,
            songQuery,
            {
              member: interaction.member as GuildMember,
              textChannel: interaction.channel as TextChannel
            }
          );
        }
      }
    },
    group: GroupAudio,
    guild_data: {
      guild_only: true,
      voice_required: true
    },
    bot_permissions: [
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.Connect,
      PermissionsBitField.Flags.ViewChannel,
      PermissionsBitField.Flags.Speak,
      PermissionsBitField.Flags.ManageMessages,
      PermissionsBitField.Flags.AttachFiles
    ]
  };
}

const liveText = i18next.t('commands:play_stream');

export async function songSearchAutocomplete(interaction: AutocompleteInteraction) {
  const focusedValue = interaction.options.getFocused(false);

  if (focusedValue) {
    const choices = await ytsr(focusedValue, {
      safeSearch: true,
      limit: 10,
      type: SearchResultType.VIDEO
    });

    const finalResult = choices.items.map((video: ytsr.Video) => {
      const duration = video.isLive ? liveText : video.duration;
      let choiceString = `${duration} | ${truncateString(video.author?.name ?? ' ', 20)} | `;
      choiceString += truncateString(video.name, 100 - choiceString.length);
      return {
        name: choiceString,
        value: video.url
      };
    });

    await interaction.respond(finalResult as Array<ApplicationCommandOptionChoiceData>);
    return;
  }

  await interaction.respond([]);
}
