import { Client, GuildTextBasedChannel, Message } from 'discord.js';
import { PlayerEmbed } from './PlayerEmbed.js';
import { Queue, Song } from 'distube';
import { PlayerButtons } from './PlayerButtons.js';
import { AudioPlayerState } from './AudioPlayerTypes.js';
import { checkBotInVoice } from '../utilities/checkBotInVoice.js';
import i18next from 'i18next';
import { ENV } from '../EnvironmentVariables.js';
import { loggerError } from '../utilities/logger.js';
import { generateSimpleEmbed } from '../utilities/generateSimpleEmbed.js';

export class PlayerInstance {
  private readonly client: Client;
  // TextChannel where player was created
  readonly textChannel: GuildTextBasedChannel;
  // Player state
  private state: AudioPlayerState = 'loading';
  // Player embed interface
  embedBuilder: PlayerEmbed = new PlayerEmbed();
  // Player buttons for embed
  private buttonsHandler: PlayerButtons;
  // Message where player is stored right now
  private messageWithPlayer: Message | undefined;
  private queue: Queue;
  // Variable for "recreationPlayer"
  lastDeletedMessage: Message | undefined;
  // Delay for player recreation
  private updateTime = 3500; // in ms
  // Timer for "recreationPlayer"
  private recreationTimer: NodeJS.Timeout | undefined;
  // Time for "waiting" state
  private finishTime = 20000; // in ms
  // Timer object for "waiting" state
  private finishTimer: NodeJS.Timeout | undefined;

  // If no one in voice channel, start afk timer
  private afkTime = 20000; // in ms
  private afkTimer: NodeJS.Timeout | undefined;

  private leaveOnEmpty: boolean;

  constructor(client: Client, txtChannel: GuildTextBasedChannel, queue: Queue) {
    this.client = client;
    this.textChannel = txtChannel;
    this.queue = queue;
    this.buttonsHandler = new PlayerButtons(this.client, this.textChannel);
    this.leaveOnEmpty = false;
  }

  async startAfkTimer() {
    try {
      this.afkTimer = setTimeout(async () => {
        await this.client.audioPlayer.stop(this.textChannel.guild.id);
        await this.textChannel.send({
          embeds: [generateSimpleEmbed(i18next.t('audioplayer:event_empty') as string)]
        });
        await this.stopAfkTimer();
        await this.stopFinishTimer();
      }, this.afkTime);
    } catch (e) {
      if (ENV.BOT_VERBOSE_LOGGING) loggerError(e);
    }
  }

  async stopAfkTimer() {
    if (this.afkTimer) {
      clearTimeout(this.afkTimer);
    }
  }

  // If a player is in "waiting" state, they start finish timer.
  // It can be canceled by switching state to any other state
  async startFinishTimer() {
    try {
      if (checkBotInVoice(this.textChannel.guild)) {
        await this.stopFinishTimer();
        this.finishTimer = setTimeout(async () => {
          const queue = this.client.audioPlayer.distube.getQueue(this.textChannel.guild.id);
          // loggerSend('try to stop player on cooldown')
          if (queue) return;
          if (checkBotInVoice(this.textChannel.guild)) {
            await this.client.audioPlayer.stop(this.textChannel.guild.id);
            await this.textChannel.send({
              embeds: [generateSimpleEmbed(i18next.t('audioplayer:event_finish_time') as string)]
            });
            await this.stopFinishTimer();
            await this.stopAfkTimer();
          }
        }, this.finishTime);
      }
    } catch (e) {
      if (ENV.BOT_VERBOSE_LOGGING) loggerError(e);
    }
  }
  // Cancel finish timer
  private async stopFinishTimer() {
    if (this.finishTimer) {
      clearTimeout(this.finishTimer);
    }
  }
  // Update embed interface to represent the current state of player, BUT THIS NOT PUSHES UPDATED EMBED TO MESSAGE
  private updateEmbedState() {
    const queue: Queue | undefined = this.client.audioPlayer.distube.getQueue(this.textChannel.guild.id);
    if (queue) {
      this.queue = queue;
    }
    this.embedBuilder.setPlayerState(this.state);

    const currentSong: Song = this.queue.songs[0];
    if (currentSong) {
      this.embedBuilder.setSongDuration(currentSong.duration, currentSong.isLive);
      this.embedBuilder.setSongSource(currentSong);
      this.embedBuilder.setSongTitle(
        currentSong.name ?? i18next.t('audioplayer:player_embed_unknown'),
        currentSong.url!
      );
      this.embedBuilder.setThumbnailURL(currentSong.thumbnail ?? null);
      this.embedBuilder.setUploader(currentSong.uploader.name);

      if (currentSong.user) {
        this.embedBuilder.setRequester(currentSong.user!);
      }
    }
    this.embedBuilder.setNextSong(this.queue.songs[1]?.name);
    this.embedBuilder.setQueueData(this.queue.songs.length, this.queue.duration);

    this.embedBuilder.update();
  }

  // Update a message with player with embed and buttons
  private async updateMessageState() {
    if (!this.messageWithPlayer) return;
    try {
      this.buttonsHandler.setComponentsState(this.state);
      await this.messageWithPlayer.edit({
        embeds: [this.embedBuilder],
        components: this.buttonsHandler.getComponents()
      });
    } catch (e) {
      if (ENV.BOT_VERBOSE_LOGGING) loggerError(e);
    }
  }

  // Send a first player message
  async init() {
    try {
      this.updateEmbedState();

      if (!this.messageWithPlayer) {
        //loggerSend("Player Init")
        this.messageWithPlayer = await this.textChannel.send({ embeds: [this.embedBuilder] });
      } else {
        await this.recreatePlayer();
      }
    } catch (e) {
      if (ENV.BOT_VERBOSE_LOGGING) loggerError(e);
    }
  }

  // Attempt to recreate player if is deleted, or it is not the last message in the text channel
  async recreatePlayer() {
    if (!this.messageWithPlayer) return;
    await this.stopRecreationTimer(); // We stop recreation in recreatePlayer to keep "singleton" for this recreatePlayer
    this.recreationTimer = setTimeout(async () => {
      if (!this.messageWithPlayer) return;
      const messages = await this.textChannel.messages.fetch({ limit: 1 });
      const lastMessage = messages.first();

      if (lastMessage?.id !== this.messageWithPlayer.id) {
        try {
          this.lastDeletedMessage = this.messageWithPlayer;
          await this.messageWithPlayer.delete();
        } finally {
          this.messageWithPlayer = await this.textChannel.send({ embeds: [this.embedBuilder] });
          await this.updateMessageState();
        }
      }
    }, this.updateTime);
  }
  // Cancel recreatePlayer
  private async stopRecreationTimer() {
    if (this.recreationTimer) {
      clearTimeout(this.recreationTimer);
    }
  }

  // Update embed and player message
  async update() {
    if (!this.messageWithPlayer) return;
    if (this.state === 'destroying') return;
    if (!this.client.audioPlayer.distube.voices.has(this.messageWithPlayer.guild!)) {
      //loggerSend("I am not in channel, so destroy")
      await this.destroy();
      return;
    }

    try {
      this.updateEmbedState();
      await this.updateMessageState();
    } catch (e) {
      if (ENV.BOT_VERBOSE_LOGGING) loggerError(e);
    }
  }

  // Destroy the player and all related stuff
  async destroy() {
    //loggerSend("Player Destroy")
    await this.setState('destroying');
    await this.stopRecreationTimer();
    await this.stopFinishTimer();
    if (!this.messageWithPlayer) return;
    try {
      this.buttonsHandler.destroy();
      this.lastDeletedMessage = this.messageWithPlayer;
      if (await this.messageWithPlayer?.delete()) {
        // In very rare cases, a player message after deleting can be sent again.
        // This timeout is a workaround for this case.
        setTimeout(async () => {
          try {
            await this.messageWithPlayer?.delete();
          } catch (e) {
            //if (ENV.BOT_VERBOSE_LOGGING) loggerError(e);
          }
        }, 5000);
      }
    } catch (e) {
      //if (ENV.BOT_VERBOSE_LOGGING) loggerError(e);
    }
  }

  // Changed state of the player and update player message
  async setState(state: AudioPlayerState) {
    this.state = state;
    // When Distube is waiting the song, they remove their Queue object.
    // So when we try to play a new song, we need to receive a new Queue
    const queue = this.client.audioPlayer.distube.getQueue(this.textChannel.guild.id);
    if (queue) {
      this.queue = queue;
    }

    if (this.state === 'waiting' && this.leaveOnEmpty) {
      await this.startFinishTimer();
    } else if (queue) {
      await this.stopFinishTimer();
    }

    await this.update();
  }

  async setLeaveOnEmpty(mode: boolean) {
    this.leaveOnEmpty = mode;
    this.embedBuilder.setLeaveOnEmpty(mode);

    if (this.state === 'waiting') {
      if (mode) {
        await this.startFinishTimer();
      }
      if (!mode) {
        await this.stopAfkTimer();
        await this.stopFinishTimer();
      }
    }
    await this.update();
  }

  getState() {
    return this.state;
  }

  // Debug info for text command $audiodebug
  debug(): string {
    return `GuildName: ${this.textChannel.guild.name}, Player State: ${this.state}, GuildID: ${this.textChannel.guildId},  VoiceChannelID: ${this.queue.voice.channel.id}, VoiceChannelName: ${this.queue.voice.channel.name}, TextChannelId: ${this.textChannel.id}, TextChannelName: ${this.textChannel.name} Message ID: ${this.messageWithPlayer?.id}\n`;
  }
}
