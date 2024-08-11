import { ICommand } from '../../CommandTypes.js';
import i18next from 'i18next';
import { EmbedBuilder, Guild, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import { GroupAudio } from './AudioTypes.js';
import { getOrCreateGuildSongsHistory } from '../../schemas/SchemaSongsHistory.js';

export default function (): ICommand {
  return {
    text_data: {
      name: 'history',
      description: i18next.t('commands:history_desc'),
      execute: async (message) => {
        await message.reply({
          embeds: [await generateSongHistoryEmbed(message.guild as Guild)]
        });
      }
    },
    slash_data: {
      slash_builder: new SlashCommandBuilder()
        .setName('history')
        .setDescription(i18next.t('commands:history_desc')),
      execute: async (interaction) => {
        await interaction.deferReply();

        await interaction.editReply({
          embeds: [await generateSongHistoryEmbed(interaction.guild as Guild)]
        });
      }
    },
    guild_data: {
      guild_only: true
    },
    group: GroupAudio,
    bot_permissions: [PermissionsBitField.Flags.SendMessages]
  };
}

async function generateSongHistoryEmbed(guild: Guild): Promise<EmbedBuilder> {
  const history = await getOrCreateGuildSongsHistory(guild.id);

  if (!history) throw Error(`Can't find guild songs history: ${guild.id}`);

  const historyEmbed = new EmbedBuilder().setTitle(`История песен для сервера ${guild.name}`);

  if (history.songsHistory.length === 0) {
    historyEmbed.setTitle('На этом сервере ещё не было отыграно ни одной песни, станьте первым!');
    return historyEmbed;
  }

  let queueList = '';

  for (let i = 0; i < history.songsHistory.length; i++) {
    const song = history.songsHistory[i];

    const songDate = song.createdAt
      ? `<t:${Math.round(song.createdAt.getTime() / 1000)}:f>`
      : '<t:0:f>';

    queueList +=
      `${i + 1}. ` +
      `[${song.name}](${song.url})` +
      ` - <@${song.requester}>` +
      ` - ${songDate}` +
      '\n';
  }

  historyEmbed.setDescription(queueList);

  return historyEmbed;
}
