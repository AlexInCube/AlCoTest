import { ICommand, ReplyContext } from '../../CommandTypes.js';
import { GroupAudio } from './AudioTypes.js';
import { EmbedBuilder, Message, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import i18next from 'i18next';
import { UserPlaylistGetPlaylists } from '../../schemas/SchemaPlaylist.js';
import { generateErrorEmbed } from '../../utilities/generateErrorEmbed.js';

export default function (): ICommand {
  return {
    text_data: {
      name: 'pl-my',
      description: i18next.t('commands:pl-my_desc'),
      execute: async (message: Message) => {
        await plMyAndReply(message, message.author.id);
      }
    },
    slash_data: {
      slash_builder: new SlashCommandBuilder().setName('pl-my').setDescription(i18next.t('commands:pl-my_desc')),
      execute: async (interaction) => {
        await plMyAndReply(interaction, interaction.user.id);
      }
    },
    group: GroupAudio,
    bot_permissions: [PermissionsBitField.Flags.SendMessages]
  };
}

async function plMyAndReply(ctx: ReplyContext, userID: string) {
  const playlists = await UserPlaylistGetPlaylists(userID);

  if (playlists && playlists.length > 0) {
    let playlistList = '';

    playlists.forEach((playlist, index) => {
      playlistList += `${index + 1}. ` + `${playlist.name}` + '\n';
    });

    const playlistEmbed = new EmbedBuilder()
      .setTitle(`${i18next.t('commands:pl-my_embed_title')}`)
      .setDescription(`${playlistList}`.slice(0, 4096));

    await ctx.reply({ embeds: [playlistEmbed], ephemeral: true });
    return;
  }

  await ctx.reply({ embeds: [generateErrorEmbed(`${i18next.t('commands:pl-my_embed_error')}`)], ephemeral: true });
}
