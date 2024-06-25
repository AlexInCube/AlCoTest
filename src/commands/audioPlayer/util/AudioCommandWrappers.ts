import { generateErrorEmbed } from '../../../utilities/generateErrorEmbed.js';
import { ChatInputCommandInteraction, Message } from 'discord.js';
import i18next from 'i18next';

export async function AudioCommandWrapperText(message: Message, callback: () => void) {
  const player = message.client.audioPlayer.playersManager.get(message.guildId!);
  if (player) {
    if (player.getState() == 'loading') {
      await message.reply({
        embeds: [
          generateErrorEmbed(i18next.t('audioplayer:audio_commands_wrapper_song_processing'))
        ]
      });
      return;
    }
    callback();
  } else {
    await message.reply({
      embeds: [generateErrorEmbed(i18next.t('audioplayer:audio_commands_wrapper_player_not_exist'))]
    });
  }
}
export async function AudioCommandWrapperInteraction(
  interaction: ChatInputCommandInteraction,
  callback: () => void
) {
  const player = interaction.client.audioPlayer.playersManager.get(interaction.guildId!);
  if (player) {
    if (player.getState() == 'loading') {
      await interaction.reply({
        embeds: [
          generateErrorEmbed(i18next.t('audioplayer:audio_commands_wrapper_song_processing'))
        ],
        ephemeral: true
      });
      return;
    }
    callback();
  } else {
    await interaction.reply({
      embeds: [
        generateErrorEmbed(i18next.t('audioplayer:audio_commands_wrapper_player_not_exist'))
      ],
      ephemeral: true
    });
  }
}
