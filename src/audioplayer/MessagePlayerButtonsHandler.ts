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
import { generateSkipMessage, generateSkipMessageFailure } from '../commands/audio/skip.command.js';
import { generateMessageAudioPlayerStop } from '../commands/audio/stop.command.js';
import {
  generateMessageAudioPlayerPrevious,
  generateMessageAudioPlayerPreviousFailure
} from '../commands/audio/previous.command.js';
import {
  generateMessageAudioPlayerShuffle,
  generateMessageAudioPlayerShuffleFailure
} from '../commands/audio/shuffle.command.js';
import { AudioPlayerIcons } from './AudioPlayerTypes.js';

enum ButtonIDs {
  stopMusic = 'stopMusic',
  pauseMusic = 'pauseMusic',
  toggleLoopMode = 'toggleLoopMode',
  previousSong = 'previousSong',
  skipSong = 'skipSong',
  //downloadSong = 'downloadSong',
  shuffle = 'shuffle',
  showQueue = 'showQueue'
}

export class MessagePlayerButtonsHandler {
  rowPrimary = new ActionRowBuilder<ButtonBuilder>();
  rowSecondary = new ActionRowBuilder<ButtonBuilder>();
  rowWithOnlyStop = new ActionRowBuilder<ButtonBuilder>();
  collector: InteractionCollector<ButtonInteraction>;
  client: Client;
  constructor(client: Client, textChannel: GuildTextBasedChannel) {
    this.client = client;

    this.rowPrimary.addComponents(
      new ButtonBuilder()
        .setCustomId(ButtonIDs.stopMusic)
        .setStyle(ButtonStyle.Danger)
        .setEmoji(AudioPlayerIcons.stop),
      new ButtonBuilder()
        .setCustomId(ButtonIDs.pauseMusic)
        .setStyle(ButtonStyle.Primary)
        .setEmoji(AudioPlayerIcons.pause),
      new ButtonBuilder()
        .setCustomId(ButtonIDs.toggleLoopMode)
        .setStyle(ButtonStyle.Primary)
        .setEmoji(AudioPlayerIcons.toogleLoopMode),
      new ButtonBuilder()
        .setCustomId(ButtonIDs.previousSong)
        .setStyle(ButtonStyle.Primary)
        .setEmoji(AudioPlayerIcons.previous),
      new ButtonBuilder()
        .setCustomId(ButtonIDs.skipSong)
        .setStyle(ButtonStyle.Primary)
        .setEmoji(AudioPlayerIcons.skip)
    );

    this.rowSecondary.addComponents(
      //new ButtonBuilder().setCustomId(ButtonIDs.downloadSong).setStyle(ButtonStyle.Success).setEmoji('<:downloadwhite:1014553027614617650>'),
      new ButtonBuilder()
        .setCustomId(ButtonIDs.shuffle)
        .setStyle(ButtonStyle.Primary)
        .setEmoji(AudioPlayerIcons.shuffle),
      new ButtonBuilder()
        .setCustomId(ButtonIDs.showQueue)
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(AudioPlayerIcons.list)
    );

    this.rowWithOnlyStop.addComponents(
      new ButtonBuilder()
        .setCustomId(ButtonIDs.stopMusic)
        .setStyle(ButtonStyle.Danger)
        .setEmoji(AudioPlayerIcons.stop)
    );

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
                content: generateMessageAudioPlayerStop(ButtonInteraction.member as GuildMember)
              });
            }

            await this.client.audioPlayer.stop(guild);

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
                content: generateMessageAudioPlayerPrevious(
                  ButtonInteraction.member as GuildMember,
                  song
                )
              });
            } else {
              await ButtonInteraction.reply({
                content: generateMessageAudioPlayerPreviousFailure(),
                ephemeral: true
              });
            }
            break;
          }

          case ButtonIDs.skipSong: {
            const song = await this.client.audioPlayer.skip(ButtonInteraction.guild as Guild);

            if (song) {
              await ButtonInteraction.reply({
                content: generateSkipMessage(song, ButtonInteraction.member as GuildMember)
              });
            } else {
              await ButtonInteraction.reply({
                content: generateSkipMessageFailure(),
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
          //     const song = this.client.audioplayer.distube.getQueue(ButtonInteraction.guild as Guild)?.songs[0]
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
                content: generateMessageAudioPlayerShuffle(ButtonInteraction.member as GuildMember)
              });
            } else {
              await ButtonInteraction.reply(generateMessageAudioPlayerShuffleFailure());
            }
            break;
          }
        }
      } catch (e) {
        loggerError(e);
      }
    });
  }

  getComponents(): Array<ActionRowBuilder<ButtonBuilder>> {
    return [this.rowPrimary, this.rowSecondary];
  }

  getComponentsOnlyStop(): Array<ActionRowBuilder<ButtonBuilder>> {
    return [this.rowWithOnlyStop];
  }

  destroy() {
    this.collector.stop();
  }
}
