import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  InteractionCollector,
  ComponentType,
  Client,
  GuildMember,
  ButtonInteraction,
  Guild,
  GuildTextBasedChannel
} from 'discord.js';
import { checkMemberInVoiceWithBot } from '../utilities/checkMemberInVoiceWithBot.js';
import { generateErrorEmbed } from '../utilities/generateErrorEmbed.js';
import { loggerError } from '../utilities/logger.js';
import { generateSkipEmbed, generateSkipEmbedFailure } from '../commands/audio/skip.command.js';
import {
  generateEmbedAudioPlayerShuffle,
  generateEmbedAudioPlayerShuffleFailure
} from '../commands/audio/shuffle.command.js';
import { AudioPlayerIcons, AudioPlayerState } from './AudioPlayerTypes.js';
import { generateEmbedAudioPlayerStop } from '../commands/audio/stop.command.js';
import {
  generateEmbedAudioPlayerPrevious,
  generateEmbedAudioPlayerPreviousFailure
} from '../commands/audio/previous.command.js';
import { ENV } from '../EnvironmentVariables.js';

enum ButtonIDs {
  stopMusic = 'stopMusic',
  pauseMusic = 'pauseMusic',
  toggleLoopMode = 'toggleLoopMode',
  previousSong = 'previousSong',
  skipSong = 'skipSong',
  //downloadSong = 'downloadSong',
  shuffle = 'shuffle',
  showQueue = 'showQueue',
  lyrics = 'lyrics'
}

const rowPrimary = new ActionRowBuilder<ButtonBuilder>().addComponents(
  new ButtonBuilder().setCustomId(ButtonIDs.stopMusic).setStyle(ButtonStyle.Danger).setEmoji(AudioPlayerIcons.stop),
  new ButtonBuilder().setCustomId(ButtonIDs.pauseMusic).setStyle(ButtonStyle.Primary).setEmoji(AudioPlayerIcons.pause),
  new ButtonBuilder()
    .setCustomId(ButtonIDs.toggleLoopMode)
    .setStyle(ButtonStyle.Primary)
    .setEmoji(AudioPlayerIcons.toogleLoopMode),
  new ButtonBuilder()
    .setCustomId(ButtonIDs.previousSong)
    .setStyle(ButtonStyle.Primary)
    .setEmoji(AudioPlayerIcons.previous),
  new ButtonBuilder().setCustomId(ButtonIDs.skipSong).setStyle(ButtonStyle.Primary).setEmoji(AudioPlayerIcons.skip)
);

const rowPrimaryPaused = new ActionRowBuilder<ButtonBuilder>().addComponents(
  new ButtonBuilder().setCustomId(ButtonIDs.stopMusic).setStyle(ButtonStyle.Danger).setEmoji(AudioPlayerIcons.stop),
  new ButtonBuilder().setCustomId(ButtonIDs.pauseMusic).setStyle(ButtonStyle.Success).setEmoji(AudioPlayerIcons.play),
  new ButtonBuilder()
    .setCustomId(ButtonIDs.toggleLoopMode)
    .setStyle(ButtonStyle.Primary)
    .setEmoji(AudioPlayerIcons.toogleLoopMode),
  new ButtonBuilder()
    .setCustomId(ButtonIDs.previousSong)
    .setStyle(ButtonStyle.Primary)
    .setEmoji(AudioPlayerIcons.previous),
  new ButtonBuilder().setCustomId(ButtonIDs.skipSong).setStyle(ButtonStyle.Primary).setEmoji(AudioPlayerIcons.skip)
);

const rowSecondary = new ActionRowBuilder<ButtonBuilder>().addComponents(
  //new ButtonBuilder().setCustomId(ButtonIDs.downloadSong).setStyle(ButtonStyle.Success).setEmoji('<:downloadwhite:1014553027614617650>'),
  new ButtonBuilder().setCustomId(ButtonIDs.shuffle).setStyle(ButtonStyle.Primary).setEmoji(AudioPlayerIcons.shuffle),
  new ButtonBuilder().setCustomId(ButtonIDs.showQueue).setStyle(ButtonStyle.Secondary).setEmoji(AudioPlayerIcons.list)
);

if (ENV.BOT_GENIUS_TOKEN) {
  rowSecondary.addComponents(
    new ButtonBuilder().setCustomId(ButtonIDs.lyrics).setStyle(ButtonStyle.Secondary).setEmoji(AudioPlayerIcons.lyrics)
  );
}

const rowWithOnlyStop = new ActionRowBuilder<ButtonBuilder>().addComponents(
  new ButtonBuilder().setCustomId(ButtonIDs.stopMusic).setStyle(ButtonStyle.Danger).setEmoji(AudioPlayerIcons.stop)
);

export class PlayerButtons {
  private collector: InteractionCollector<ButtonInteraction>;
  private client: Client;
  private components: Array<ActionRowBuilder<ButtonBuilder>>;

  constructor(client: Client, textChannel: GuildTextBasedChannel) {
    this.components = [rowPrimary, rowSecondary];
    this.client = client;

    this.collector = textChannel.createMessageComponentCollector({
      componentType: ComponentType.Button
    });

    this.collector.on('collect', async (ButtonInteraction: ButtonInteraction) => {
      try {
        const checkObj = await checkMemberInVoiceWithBot(ButtonInteraction.member as GuildMember);
        if (!checkObj.channelTheSame) {
          await ButtonInteraction.reply({
            embeds: [generateErrorEmbed(checkObj.errorMessage)],
            ephemeral: true
          });
          return;
        }

        switch (ButtonInteraction.customId) {
          case ButtonIDs.stopMusic: {
            const guild = ButtonInteraction.guild as Guild;

            const player = this.client.audioPlayer.playersManager.get(guild.id);

            if (player) {
              await player.textChannel.send({
                embeds: [generateEmbedAudioPlayerStop(ButtonInteraction.member as GuildMember)]
              });
            }

            await this.client.audioPlayer.stop(guild.id);

            await ButtonInteraction.deferUpdate();
            break;
          }
          case ButtonIDs.pauseMusic:
            await this.client.audioPlayer.pauseResume(ButtonInteraction.guild as Guild);
            await ButtonInteraction.deferUpdate();
            break;

          case ButtonIDs.previousSong: {
            const song = await this.client.audioPlayer.previous(ButtonInteraction.guild as Guild);
            if (song) {
              await ButtonInteraction.reply({
                embeds: [generateEmbedAudioPlayerPrevious(ButtonInteraction.member as GuildMember, song)]
              });
            } else {
              await ButtonInteraction.reply({
                embeds: [generateEmbedAudioPlayerPreviousFailure()],
                ephemeral: true
              });
            }
            break;
          }

          case ButtonIDs.skipSong: {
            const song = await this.client.audioPlayer.skip(ButtonInteraction.guild as Guild);

            if (song) {
              await ButtonInteraction.reply({
                embeds: [generateSkipEmbed(song, ButtonInteraction.member as GuildMember)]
              });
            } else {
              await ButtonInteraction.reply({
                embeds: [generateSkipEmbedFailure()],
                ephemeral: true
              });
            }
            break;
          }

          case ButtonIDs.toggleLoopMode:
            await this.client.audioPlayer.changeLoopMode(ButtonInteraction.guild as Guild);
            await ButtonInteraction.deferUpdate();
            break;

          // case ButtonIDs.downloadSong: {
          //     const song = this.client.audioplayer.distube.getQueue(ButtonInteraction.guild as guild)?.songs[0]
          //
          //     if (!song) {
          //         await ButtonInteraction.reply({embeds: [generateErrorEmbed(i18next.t("audioplayer:download_song_error"))]})
          //         break
          //     }
          //     await ButtonInteraction.reply({ephemeral: true, embeds: [generateDownloadSongEmbed(song.streamURL ?? song.url)]})
          //     break
          // }

          case ButtonIDs.showQueue:
            await this.client.audioPlayer.showQueue(ButtonInteraction);
            break;

          case ButtonIDs.shuffle: {
            if (await this.client.audioPlayer.shuffle(ButtonInteraction.guild as Guild)) {
              await ButtonInteraction.reply({
                embeds: [generateEmbedAudioPlayerShuffle(ButtonInteraction.member as GuildMember)]
              });
            } else {
              await ButtonInteraction.reply({ embeds: [generateEmbedAudioPlayerShuffleFailure()] });
            }
            break;
          }

          case ButtonIDs.lyrics: {
            await this.client.audioPlayer.showLyrics(ButtonInteraction);
          }
        }
      } catch (e) {
        loggerError(e);
      }
    });
  }

  setComponentsState(state: AudioPlayerState) {
    switch (state) {
      case 'playing':
        this.components = [rowPrimary, rowSecondary];
        break;
      case 'pause':
        this.components = [rowPrimaryPaused, rowSecondary];
        break;
      case 'loading':
      case 'waiting':
      case 'destroying':
      default:
        this.components = [rowWithOnlyStop];
    }
  }

  getComponents(): Array<ActionRowBuilder<ButtonBuilder>> {
    return this.components;
  }

  destroy() {
    this.collector.stop();
  }
}
