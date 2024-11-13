import { Client, GuildTextBasedChannel, Message } from 'discord.js';
import { PlayerEmbed } from './PlayerEmbed.js';
import { PlayerButtons } from './PlayerButtons.js';
import { AudioPlayerState } from './AudioPlayerIcons.js';
import { checkBotInVoice } from '../utilities/checkBotInVoice.js';
import i18next from 'i18next';
import { ENV } from '../EnvironmentVariables.js';
import { loggerError } from '../utilities/logger.js';
import { generateSimpleEmbed } from '../utilities/generateSimpleEmbed.js';
import { Player, Riffy, Track } from 'riffy';

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
  private riffy;
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

  constructor(client: Client, txtChannel: GuildTextBasedChannel, riffy: Riffy) {
    this.client = client;
    this.textChannel = txtChannel;
    this.riffy = riffy;
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
          const riffyPlayer = this.riffy.get(this.textChannel.guild.id);
          // loggerSend('try to stop player on cooldown')
          if (riffyPlayer) return;
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
    const riffyPlayer: Player = this.riffy.get(this.textChannel.guild.id);
    // loggerSend('try to stop player on cooldown')
    if (!riffyPlayer) return;
    this.embedBuilder.setPlayerState(this.state);

    const currentSong: Track | null = riffyPlayer.current;
    if (currentSong) {
      this.embedBuilder.setSongDuration(currentSong.info.length, currentSong.info.stream);
      this.embedBuilder.setSongSource(currentSong);
      this.embedBuilder.setSongTitle(
        currentSong.info.title ?? i18next.t('audioplayer:player_embed_unknown'),
        currentSong.info.uri!
      );
      this.embedBuilder.setThumbnailURL(currentSong.info.thumbnail);
      this.embedBuilder.setUploader(currentSong.info.author);

      if (currentSong.info.requester) {
        this.embedBuilder.setRequester(currentSong.info.requester);
      }
    }
    this.embedBuilder.setNextSong(riffyPlayer.queue.at(1)?.info.title);
    this.embedBuilder.setQueueData(riffyPlayer.queue);

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
      try {
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
      } catch {
        /* empty */
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
    const riffyPlayer: Player = this.riffy.get(this.textChannel.guild.id);
    if (!riffyPlayer) {
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
          } catch {
            //if (ENV.BOT_VERBOSE_LOGGING) loggerError(e);
          }
        }, 5000);
      }
    } catch {
      //if (ENV.BOT_VERBOSE_LOGGING) loggerError(e);
    }
  }

  // Changed state of the player and update player message
  async setState(state: AudioPlayerState) {
    try {
      this.state = state;
      const riffyPlayer: Player = this.riffy.get(this.textChannel.guild.id);
      if (!riffyPlayer) return;

      if (this.state === 'waiting' && this.leaveOnEmpty) {
        await this.startFinishTimer();
      } else if (riffyPlayer.queue.length > 0) {
        await this.stopFinishTimer();
      }

      await this.update();
    } catch {
      /* empty */
    }
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
    const riffyPlayer: Player = this.riffy.get(this.textChannel.guild.id);
    if (!riffyPlayer) return 'undefined';
    return `GuildName: ${this.textChannel.guild.name}, Player State: ${this.state}, GuildID: ${this.textChannel.guildId}, VoiceChannel: ${riffyPlayer.voiceChannel}, TextChannelId: ${this.textChannel.id}, TextChannelName: ${this.textChannel.name} Message ID: ${this.messageWithPlayer?.id}\n`;
  }
}
