import { CommandArgument, ICommand, ReplyContext } from '../../CommandTypes.js';
import {
  ApplicationCommandOptionChoiceData,
  AutocompleteInteraction,
  Guild,
  GuildMember,
  Message,
  PermissionsBitField,
  SlashCommandBuilder,
  TextChannel,
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
import { commandEmptyReply } from '../../utilities/commandEmptyReply.js';

export const services = 'Youtube, Spotify, Soundcloud, Yandex Music, Apple Music, HTTP-stream';
export default function (): ICommand {
  return {
    text_data: {
      name: 'play',
      description: i18next.t('commands:play_desc'),
      arguments: [new CommandArgument(i18next.t('commands:play_arg_link', { services: services }), true)],
      execute: async (message: Message, args: string[]) => {
        // Play command accept only one arg is a query string.
        // In text command system we need to merge all words for request in one string
        const songQuery = args.join(' ');

        await playAndReply(message, songQuery);
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
        const songQuery = interaction.options.getString('request')!;

        await playAndReply(interaction, songQuery);
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
      PermissionsBitField.Flags.ManageMessages
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

    const finalResult: Array<ApplicationCommandOptionChoiceData> = choices.items.map((video: ytsr.Video) => {
      const duration = video.isLive ? liveText : video.duration;
      let choiceString = `${duration} | ${truncateString(video.author?.name ?? ' ', 20)} | `;
      choiceString += truncateString(video.name, 100 - choiceString.length);
      return {
        name: choiceString,
        value: video.url
      };
    });

    await interaction.respond(finalResult);
    return;
  }

  await interaction.respond([]);
}

async function playAndReply(ctx: ReplyContext, songQuery: string) {
  if (queueSongsIsFull(ctx.client, ctx.guild as Guild)) {
    await ctx.reply({
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

  await commandEmptyReply(ctx);

  const member = ctx.member as GuildMember;

  await ctx.client.audioPlayer.play(member.voice.channel as VoiceChannel, ctx.channel as TextChannel, songQuery, {
    member,
    textChannel: ctx.channel as TextChannel
  });
}
