import {
  DisTube,
  PlayOptions,
  Queue,
  RepeatMode,
  Song,
  Events as DistubeEvents,
  Playlist
} from 'distube';
import { AudioPlayersStore } from './AudioPlayersStore.js';
import { pagination } from '../utilities/pagination/pagination.js';
import { ButtonStyles, ButtonTypes } from '../utilities/pagination/paginationTypes.js';
import { clamp } from '../utilities/clamp.js';
import { generateErrorEmbed } from '../utilities/generateErrorEmbed.js';
import i18next from 'i18next';
import { loggerError, loggerSend } from '../utilities/logger.js';
import { ENV } from '../EnvironmentVariables.js';
import { LoadPlugins } from './LoadPlugins.js';
import { generateAddedPlaylistMessage } from './util/generateAddedPlaylistMessage.js';
import { generateAddedSongMessage } from './util/generateAddedSongMessage.js';
import {
  ButtonInteraction,
  Client,
  CommandInteraction,
  Embed,
  EmbedBuilder,
  Guild,
  Interaction,
  TextChannel,
  VoiceBasedChannel
} from 'discord.js';
import { joinVoiceChannel } from '@discordjs/voice';
import { generateWarningEmbed } from '../utilities/generateWarningEmbed.js';
import { generateLyricsEmbed } from './Lyrics.js';
import { getGuildOptionLeaveOnEmpty, setGuildOptionLeaveOnEmpty } from '../schemas/SchemaGuild.js';

export const loggerPrefixAudioplayer = `Audioplayer`;

const plugins = await LoadPlugins();

export class AudioPlayersManager {
  client: Client;
  playersManager: AudioPlayersStore;
  distube: DisTube;
  constructor(client: Client) {
    this.client = client;
    this.client.audioPlayer = this;
    this.playersManager = new AudioPlayersStore(this.client);
    this.distube = new DisTube(this.client, {
      nsfw: true,
      emitAddListWhenCreatingQueue: true,
      emitAddSongWhenCreatingQueue: true,
      savePreviousSongs: true,
      joinNewVoiceChannel: true,
      plugins: plugins
    });

    this.setupEvents();
  }

  async play(
    voiceChannel: VoiceBasedChannel,
    textChannel: TextChannel,
    song: string | Song,
    options?: PlayOptions
  ) {
    try {
      const playableThing: Song | Playlist = await this.distube.handler.resolve(song);

      // I am need manual connect user to a voice channel, because when I am using only Distube "play"
      // method, getVoiceConnection in @discordjs/voice is not working
      joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guildId,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator
      });

      await this.distube.play(voiceChannel, playableThing, options);
    } catch (e) {
      if (ENV.BOT_VERBOSE_LOGGING) loggerError(e);
      await textChannel.send({
        embeds: [
          generateErrorEmbed(`${song}\n${e.message}`, i18next.t('audioplayer:play_error') as string)
        ]
      });

      const queue = this.distube.getQueue(voiceChannel.guildId);

      if (!queue) return;
      if (queue.songs.length === 0) await this.stop(voiceChannel.guild);
    }
  }

  async stop(guild: Guild) {
    const queue = this.distube.getQueue(guild);

    if (queue) {
      await queue.stop();
      queue.voice.leave();
    } else {
      this.distube.voices.leave(guild);
    }

    await this.playersManager.remove(guild.id);
  }

  async pause(guild: Guild) {
    const queue = this.distube.getQueue(guild);
    if (!queue) return;
    const player = this.playersManager.get(queue.id);
    if (!player) return;
    if (!queue.paused) {
      this.distube.pause(guild);
      await player.setState('pause');
    }

    await player.update();
  }

  async resume(guild: Guild) {
    const queue = this.distube.getQueue(guild);
    if (!queue) return;
    const player = this.playersManager.get(queue.id);
    if (!player) return;
    if (queue.paused) {
      this.distube.resume(guild);
      await player.setState('playing');
    }

    await player.update();
  }

  async pauseResume(guild: Guild) {
    const queue = this.distube.getQueue(guild);
    if (!queue) return;
    const player = this.playersManager.get(queue.id);
    if (!player) return;
    if (queue.paused) {
      this.distube.resume(guild);
      await player.setState('playing');
    } else {
      this.distube.pause(guild);
      await player.setState('pause');
    }

    await player.update();
  }

  async changeLoopMode(guild: Guild) {
    const queue = this.distube.getQueue(guild);
    if (!queue) return;
    const player = this.playersManager.get(queue.id);
    if (!player) return;

    switch (queue.repeatMode) {
      case RepeatMode.DISABLED:
        queue.setRepeatMode(RepeatMode.SONG);
        player.embedBuilder.setLoopMode('song');
        break;
      case RepeatMode.SONG:
        queue.setRepeatMode(RepeatMode.QUEUE);
        player.embedBuilder.setLoopMode('queue');
        break;
      case RepeatMode.QUEUE:
        queue.setRepeatMode(RepeatMode.DISABLED);
        player.embedBuilder.setLoopMode('disabled');
        break;
    }

    await player.update();
  }

  async skip(guild: Guild): Promise<Song | undefined> {
    try {
      const queue = this.distube.getQueue(guild);
      if (queue) {
        await this.distube.skip(guild.id);
        return queue.songs[0];
      }
    } catch (e) {
      if (ENV.BOT_VERBOSE_LOGGING) loggerError(e);
    }
    return undefined;
  }

  async shuffle(guild: Guild): Promise<Queue | undefined> {
    try {
      let queue = this.distube.getQueue(guild);
      if (queue) {
        queue = await this.distube.shuffle(guild);
        const player = this.playersManager.get(queue.id);
        if (!player) return undefined;
        await player.update();
        return queue;
      }
    } catch (e) {
      if (ENV.BOT_VERBOSE_LOGGING) loggerError(e);
    }
    return undefined;
  }

  async jump(guild: Guild, position: number): Promise<Song | undefined> {
    try {
      const queue = this.distube.getQueue(guild);
      if (queue) {
        return this.distube.jump(guild, clamp(position, 1, queue.songs.length));
      }
    } catch (e) {
      if (ENV.BOT_VERBOSE_LOGGING) loggerError(e);
    }
    return undefined;
  }

  async previous(guild: Guild): Promise<Song | undefined> {
    try {
      const queue = this.distube.getQueue(guild);
      if (queue) {
        return await this.distube.previous(guild);
      }
    } catch (e) {
      if (ENV.BOT_VERBOSE_LOGGING) loggerError(e);
    }
    return undefined;
  }

  async rewind(guild: Guild, time: number): Promise<boolean> {
    try {
      const queue = this.distube.getQueue(guild);
      if (!queue) return false;
      const player = this.playersManager.get(queue.id);
      if (!player) return false;
      if (time < 0) time = 0;
      this.distube.seek(guild, time);
      await player.setState('playing');
      return true;
    } catch (e) {
      return false;
    }
  }

  async showLyrics(interaction: ButtonInteraction) {
    if (!interaction.guild) return;
    const queue = this.distube.getQueue(interaction.guild);
    if (!queue) {
      return;
    }

    const song = queue.songs[0];

    await interaction.reply({ embeds: [await generateLyricsEmbed(song.name!)] });
  }

  async showQueue(interaction: Interaction) {
    if (!interaction.guild) return;
    const queue = this.distube.getQueue(interaction.guild);
    if (!queue) {
      return;
    }

    function buildPage(queue: Queue, pageNumber: number, entriesPerPage: number) {
      let queueList = '';

      const startingIndex = pageNumber * entriesPerPage;

      for (
        let i = startingIndex;
        i < Math.min(startingIndex + entriesPerPage, queue.songs.length);
        i++
      ) {
        const song = queue.songs[i];
        queueList +=
          `${i + 1}. ` + `[${song.name}](${song.url})` + ` - \`${song.formattedDuration}\`\n`;
      }

      const page = new EmbedBuilder()
        .setAuthor({ name: `${i18next.t('audioplayer:show_queue_songs_in_queue')}: ` })
        .setTitle(queue.songs[0].name!)
        .setDescription(
          `**${i18next.t('audioplayer:show_queue_title')}: **\n${queueList}`.slice(0, 4096)
        );

      if (queue.songs[0].url) {
        page.setURL(queue.songs[0].url);
      }

      return page;
    }

    const arrayEmbeds: Array<EmbedBuilder> = [];
    const entriesPerPage = 20;
    const pages = Math.ceil(queue.songs.length / entriesPerPage);

    for (let i = 0; i < pages; i++) {
      arrayEmbeds.push(buildPage(queue, i, entriesPerPage));
    }

    await pagination({
      embeds: arrayEmbeds as unknown as Embed[],
      author: interaction.user,
      interaction: interaction as CommandInteraction,
      ephemeral: true,
      fastSkip: true,
      pageTravel: false,
      buttons: [
        {
          type: ButtonTypes.first,
          emoji: '⬅️',
          style: ButtonStyles.Secondary
        },
        {
          type: ButtonTypes.previous,
          emoji: '◀️',
          style: ButtonStyles.Secondary
        },
        {
          type: ButtonTypes.next,
          emoji: '▶️',
          style: ButtonStyles.Secondary
        },
        {
          type: ButtonTypes.last,
          emoji: '➡️',
          style: ButtonStyles.Secondary
        }
      ]
    });
  }

  async setLeaveOnEmpty(guild: Guild, mode: boolean) {
    await setGuildOptionLeaveOnEmpty(guild.id, mode);

    const player = this.playersManager.get(guild.id);
    if (!player) return;
    await player.setLeaveOnEmpty(mode);
  }

  private setupEvents() {
    if (ENV.BOT_VERBOSE_LOGGING) {
      this.distube.on(DistubeEvents.DEBUG, (message) => {
        loggerSend(message, loggerPrefixAudioplayer);
      });
    }

    if (ENV.BOT_FFMPEG_LOGGING) {
      this.distube.on(DistubeEvents.FFMPEG_DEBUG, (message) => {
        loggerSend(message, loggerPrefixAudioplayer);
      });
    }

    this.distube
      .on(DistubeEvents.INIT_QUEUE, async (queue) => {
        await this.playersManager.add(queue.id, queue.textChannel as TextChannel, queue);

        const player = this.playersManager.get(queue.id);
        if (player) {
          const leaveOnEmpty = await getGuildOptionLeaveOnEmpty(queue.id);
          await player.setLeaveOnEmpty(leaveOnEmpty);
          await player.init();
        }
      })
      .on(DistubeEvents.PLAY_SONG, async (queue) => {
        const player = this.playersManager.get(queue.id);
        if (player) {
          await player.setState('playing');
        }
      })
      .on(DistubeEvents.DISCONNECT, async (queue) => {
        await this.playersManager.remove(queue.id);
      })
      .on(DistubeEvents.ADD_SONG, async (queue, song) => {
        if (queue.textChannel) {
          await queue.textChannel.send({ embeds: [generateAddedSongMessage(song)] });
        }

        const player = this.playersManager.get(queue.id);
        if (player) {
          await player.update();
        }
      })
      .on(DistubeEvents.ADD_LIST, async (queue, playlist) => {
        if (!queue.textChannel) return;

        await queue.textChannel.send({ embeds: [generateAddedPlaylistMessage(playlist)] });
        if (queue.songs.length >= ENV.BOT_MAX_SONGS_IN_QUEUE) {
          await queue.textChannel.send({
            embeds: [
              generateWarningEmbed(
                i18next.t('audioplayer:event_add_list_limit', {
                  queueLimit: ENV.BOT_MAX_SONGS_IN_QUEUE
                }) as string
              )
            ]
          });
          queue.songs.length = ENV.BOT_MAX_SONGS_IN_QUEUE;
        }

        const player = this.playersManager.get(queue.id);
        if (player) {
          await player.update();
        }
      })
      .on(DistubeEvents.FINISH_SONG, async (queue) => {
        if (!this.playersManager.has(queue.id)) return;
        if (queue._next || queue._prev || queue.stopped || queue.songs.length > 1) return;
        await this.playersManager.get(queue.id)?.setState('waiting');
      })
      .on(DistubeEvents.ERROR, async (error, queue) => {
        let errorName = `ERROR`;
        const errorMessage = `${error.name} + \n\n + ${error.message}`;

        if (queue.songs.length >= 1) {
          errorName = queue.songs[0].name!;
        }

        await queue.textChannel?.send({
          embeds: [generateErrorEmbed(errorMessage, errorName)]
        });
      });
  }
}
