import { ICommand } from '../../CommandTypes.js';
import {
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  Message,
  PermissionsBitField,
  SlashCommandBuilder
} from 'discord.js';
import { GroupInfo } from './InfoTypes.js';
import node_os_pkg from 'node-os-utils';
import i18next from 'i18next';

const { cpu, mem, os } = node_os_pkg;

export default function (): ICommand {
  return {
    text_data: {
      name: 'status',
      description: i18next.t('commands:status_desc'),
      execute: async (message: Message) => {
        await message.reply({
          embeds: [await generateStatusEmbed(message.client)],
          allowedMentions: { users: [] }
        });
      }
    },
    slash_data: {
      slash_builder: new SlashCommandBuilder().setName('status').setDescription(i18next.t('commands:status_desc')),
      execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.reply({
          embeds: [await generateStatusEmbed(interaction.client)],
          allowedMentions: { users: [] },
          ephemeral: true
        });
      }
    },
    group: GroupInfo,
    bot_permissions: [PermissionsBitField.Flags.SendMessages]
  };
}

export async function generateStatusEmbed(client: Client): Promise<EmbedBuilder> {
  let stateString = '';

  const memoryInfo = await mem.info();

  function addState(name: string, value: string) {
    stateString += `${name}: ${value}\n`;
  }

  addState('Github', 'https://github.com/AlexInCube/AlCoTest');
  addState(i18next.t('commands:status_embed_bot_version'), `\`${process.env.npm_package_version}\``);
  // addState("Websocket Heartbeat", `\`${client.ws.ping}\``)
  addState(i18next.t('commands:status_embed_os'), `\`${os.platform()}\``);
  addState(i18next.t('commands:status_embed_cpu'), `\`${cpu.model()}\``);
  addState(i18next.t('commands:status_embed_cpu_usage'), `\`${await cpu.usage()} %\``);
  addState(
    i18next.t('commands:status_embed_ram_usage'),
    `\`${memoryInfo.usedMemMb} mb / ${memoryInfo.totalMemMb} mb\``
  );
  addState(i18next.t('commands:status_embed_guilds_count'), `\`${client.guilds.cache.size}\``);

  return new EmbedBuilder().addFields({
    name: `${i18next.t('commands:status_embed_title')}: `,
    value: stateString
  });
}
