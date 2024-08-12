import { ICommand } from '../../CommandTypes.js';
import i18next from 'i18next';
import {
  CommandInteraction,
  Embed,
  EmbedBuilder,
  Guild,
  Message,
  PermissionsBitField,
  SlashCommandBuilder
} from 'discord.js';
import { GroupAudio } from './AudioTypes.js';
import {
  getOrCreateGuildSongsHistory,
  ISchemaSongsHistory
} from '../../schemas/SchemaSongsHistory.js';
import { pagination } from '../../utilities/pagination/pagination.js';
import { ButtonStyles, ButtonTypes } from '../../utilities/pagination/paginationTypes.js';
import { ENV } from '../../EnvironmentVariables.js';

export default function (): ICommand {
  return {
    disable: ENV.BOT_MAX_SONGS_HISTORY_SIZE === 0,
    text_data: {
      name: 'history',
      description: i18next.t('commands:history_desc'),
      execute: async (message) => {
        await replyWithSongHistory(message.guild as Guild, undefined, message);
      }
    },
    slash_data: {
      slash_builder: new SlashCommandBuilder()
        .setName('history')
        .setDescription(i18next.t('commands:history_desc')),
      execute: async (interaction) => {
        await replyWithSongHistory(interaction.guild as Guild, interaction);
      }
    },
    guild_data: {
      guild_only: true
    },
    group: GroupAudio,
    bot_permissions: [PermissionsBitField.Flags.SendMessages]
  };
}

async function replyWithSongHistory(
  guild: Guild,
  interaction?: CommandInteraction,
  message?: Message
): Promise<void> {
  const history: ISchemaSongsHistory | null = await getOrCreateGuildSongsHistory(guild.id);

  if (!history) throw Error(`Can't find guild songs history: ${guild.id}`);

  if (history.songsHistory.length === 0) {
    await interaction?.reply({
      embeds: [new EmbedBuilder().setTitle(i18next.t('commands:history_embed_no_songs'))]
    });
    await message?.reply({
      embeds: [new EmbedBuilder().setTitle(i18next.t('commands:history_embed_no_songs'))]
    });
  }

  function buildPage(history: ISchemaSongsHistory, pageNumber: number, entriesPerPage: number) {
    let songsList = '';

    const startingIndex = pageNumber * entriesPerPage;

    for (
      let i = startingIndex;
      i < Math.min(startingIndex + entriesPerPage, history.songsHistory.length);
      i++
    ) {
      const song = history.songsHistory[i];

      const songDate = song.createdAt
        ? `<t:${Math.round(song.createdAt.getTime() / 1000)}:f>`
        : '<t:0:f>';

      songsList +=
        `${i + 1}. ` +
        `[${song.name}](${song.url})` +
        ` - <@${song.requester}>` +
        ` - ${songDate}` +
        '\n';
    }

    return new EmbedBuilder()
      .setTitle(`${i18next.t('commands:history_embed_title')} ${guild.name}`)
      .setDescription(`${songsList}`.slice(0, 4096));
  }

  const arrayEmbeds: Array<EmbedBuilder> = [];
  const entriesPerPage = 20;
  const pages = Math.ceil(history.songsHistory.length / entriesPerPage);

  for (let i = 0; i < pages; i++) {
    arrayEmbeds.push(buildPage(history, i, entriesPerPage));
  }

  await pagination({
    embeds: arrayEmbeds as unknown as Embed[],
    // @ts-expect-error I need to provide Interaction or Message for different command systems.
    author: interaction?.user ?? message?.author,
    message: message,
    interaction: interaction,
    ephemeral: true,
    fastSkip: true,
    pageTravel: false,
    buttons: [
      {
        type: ButtonTypes.first,
        emoji: '⬅️',
        style: ButtonStyles.Secondary
      },
      {
        type: ButtonTypes.previous,
        emoji: '◀️',
        style: ButtonStyles.Secondary
      },
      {
        type: ButtonTypes.next,
        emoji: '▶️',
        style: ButtonStyles.Secondary
      },
      {
        type: ButtonTypes.last,
        emoji: '➡️',
        style: ButtonStyles.Secondary
      }
    ]
  });
}
