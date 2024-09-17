import { ReplyContext, ICommand } from '../../CommandTypes.js';
import i18next from 'i18next';
import { EmbedBuilder, Guild, PermissionsBitField, SlashCommandBuilder, User } from 'discord.js';
import { GroupAudio } from './AudioTypes.js';
import { getOrCreateGuildSongsHistory, ISchemaSongsHistory } from '../../schemas/SchemaSongsHistory.js';
import { ENV } from '../../EnvironmentVariables.js';
import { PaginationList } from '../../audioplayer/PaginationList.js';

export default function (): ICommand {
  return {
    disable: ENV.BOT_MAX_SONGS_HISTORY_SIZE === 0,
    text_data: {
      name: 'history',
      description: i18next.t('commands:history_desc'),
      execute: async (message) => {
        await replyWithSongHistory(message.guild as Guild, message, message.author);
      }
    },
    slash_data: {
      slash_builder: new SlashCommandBuilder().setName('history').setDescription(i18next.t('commands:history_desc')),
      execute: async (interaction) => {
        await replyWithSongHistory(interaction.guild as Guild, interaction, interaction.user);
      }
    },
    guild_data: {
      guild_only: true
    },
    group: GroupAudio,
    bot_permissions: [PermissionsBitField.Flags.SendMessages]
  };
}

async function replyWithSongHistory(guild: Guild, ctx: ReplyContext, user: User): Promise<void> {
  const history: ISchemaSongsHistory | null = await getOrCreateGuildSongsHistory(guild.id);

  if (!history) throw Error(`Can't find guild songs history: ${guild.id}`);

  if (history.songsHistory.length === 0) {
    await ctx.reply({
      embeds: [new EmbedBuilder().setTitle(i18next.t('commands:history_embed_no_songs'))],
      ephemeral: true
    });
  }

  function buildPage(history: ISchemaSongsHistory, pageNumber: number, entriesPerPage: number) {
    let songsList = '';

    const startingIndex = pageNumber * entriesPerPage;

    for (let i = startingIndex; i < Math.min(startingIndex + entriesPerPage, history.songsHistory.length); i++) {
      const song = history.songsHistory[i];

      const songDate = song.createdAt ? `<t:${Math.round(song.createdAt.getTime() / 1000)}:f>` : '<t:0:f>';

      songsList += `${i + 1}. ` + `[${song.name}](${song.url})` + ` - <@${song.requester}>` + ` - ${songDate}` + '\n';
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

  await PaginationList(ctx, arrayEmbeds, user);
}
