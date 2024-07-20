import { CommandArgument, ICommand } from '../../CommandTypes.js';
import { Message, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import i18next from 'i18next';
import { services } from './play.command.js';
import { GroupAudio } from './AudioTypes.js';
import { generateLyricsEmbed } from '../../audioplayer/Lyrics.js';
import { ENV } from '../../EnvironmentVariables.js';

export default function (): ICommand {
  return {
    disable: !ENV.BOT_GENIUS_TOKEN,
    text_data: {
      name: 'lyrics',
      description: i18next.t('commands:lyrics_desc'),
      arguments: [
        new CommandArgument(i18next.t('commands:lyrics_arg_query', { services: services }), true)
      ],
      execute: async (message: Message, args: string[]) => {
        const songQuery = args.join(' ');

        await message.reply({ embeds: [await generateLyricsEmbed(songQuery)] });
      }
    },
    slash_data: {
      slash_builder: new SlashCommandBuilder()
        .setName('lyrics')
        .setDescription(i18next.t('commands:lyrics_desc'))
        .addStringOption((option) =>
          option
            .setName('request')
            .setDescription(i18next.t('commands:lyrics_arg_query', { services: services }))
            .setRequired(true)
        ),
      execute: async (interaction) => {
        const songQuery = interaction.options.getString('request')!;

        await interaction.deferReply();
        await interaction.editReply({ embeds: [await generateLyricsEmbed(songQuery)] });
      }
    },
    group: GroupAudio,
    bot_permissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel]
  };
}
