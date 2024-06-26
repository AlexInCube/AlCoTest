import {
  Client,
  CommandInteraction,
  Embed,
  EmbedBuilder,
  Guild,
  Interaction,
  TextChannel,
  VoiceBasedChannel
} from 'discord.js';
import {
  CustomPlugin,
  DisTube,
  ExtractorPlugin,
  Playlist,
  PlayOptions,
  Queue,
  RepeatMode,
  SearchResult,
  Song
} from 'distube';
import { AudioPlayersManager } from './AudioPlayersManager.js';
import { SpotifyPlugin } from '@distube/spotify';
import { YtDlpPlugin } from '@distube/yt-dlp';
import { SoundCloudPlugin } from '@distube/soundcloud';
import { pagination } from '../../../utilities/pagination/pagination.js';
import { ButtonStyles, ButtonTypes } from '../../../utilities/pagination/paginationTypes.js';
import { clamp } from '../../../utilities/clamp.js';
import { generateErrorEmbed } from '../../../utilities/generateErrorEmbed.js';
import { joinVoiceChannel } from '@discordjs/voice';
import i18next from 'i18next';

import { YandexMusicPlugin } from 'distube-yandex-music-plugin';
import { loggerError, loggerWarn } from '../../../utilities/logger.js';
import { BOT_YOUTUBE_COOKIE, ENV } from '../../../EnvironmentVariables.js';

const loggerPrefixAudioplayer = `Audioplayer`;

function LoadPlugins(): Array<CustomPlugin | ExtractorPlugin> {
  const plugins: Array<CustomPlugin | ExtractorPlugin> = [];

  if (!BOT_YOUTUBE_COOKIE) {
    loggerWarn(
      'BOT_YOUTUBE_COOKIE is not provided, 18+ videos from Youtube is not available',
      loggerPrefixAudioplayer
    );
  }

  if (ENV.BOT_SPOTIFY_CLIENT_ID && ENV.BOT_SPOTIFY_CLIENT_SECRET) {
    plugins.push(
      new SpotifyPlugin({
        parallel: true,
        emitEventsAfterFetching: true,
        api: {
          clientId: ENV.BOT_SPOTIFY_CLIENT_ID,
          clientSecret: ENV.BOT_SPOTIFY_CLIENT_SECRET
        }
      })
    );
  } else {
    loggerWarn(
      'Spotify plugin is disabled, because BOT_SPOTIFY_CLIENT_ID and BOT_SPOTIFY_CLIENT_SECRET are wrong or not provided',
      loggerPrefixAudioplayer
    );
  }

  if (ENV.BOT_YANDEXMUSIC_TOKEN) {
    plugins.push(
      new YandexMusicPlugin({
        oauthToken: ENV.BOT_YANDEXMUSIC_TOKEN
      })
    );
  } else {
    loggerWarn(
      'Yandex Music plugin is disabled, because BOT_YANDEXMUSIC_TOKEN are wrong or not provided',
      loggerPrefixAudioplayer
    );
  }

  plugins.push(new SoundCloudPlugin());
  if (!ENV.BOT_SOUNDCLOUD_CLIENT_ID || !ENV.BOT_SOUNDCLOUD_TOKEN) {
    loggerWarn(
      'Some Soundcloud features is disabled, because BOT_SOUNDCLOUD_CLIENT_ID or BOT_SOUNDCLOUD_TOKEN are wrong or not provided',
      loggerPrefixAudioplayer
    );
  }

  plugins.push(
    new YtDlpPlugin({
      update: true
    })
  );

  return plugins;
}

export class AudioPlayerCore {
  client: Client;
  playersManager: AudioPlayersManager;
  distube: DisTube;
  constructor(client: Client) {
    this.client = client;
    this.client.audioPlayer = this;
    this.playersManager = new AudioPlayersManager(this.client);
    this.distube = new DisTube(this.client, {
      leaveOnEmpty: true,
      emptyCooldown: ENV.NODE_ENV === 'production' ? 120 : 5,
      leaveOnFinish: false,
      leaveOnStop: true,
      youtubeCookie: BOT_YOUTUBE_COOKIE ?? undefined,
      nsfw: true,
      emitAddListWhenCreatingQueue: true,
      emitAddSongWhenCreatingQueue: true,
      savePreviousSongs: true,
      plugins: LoadPlugins()
    });

    this.client.distube = this.distube;

    this.setupEvents();
  }

  async play(
    voiceChannel: VoiceBasedChannel,
    textChannel: TextChannel,
    song: string | Song | SearchResult,
    options?: PlayOptions
  ) {
    await this.distube.voices.join(voiceChannel);

    joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guildId,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator
    });

    try {
      await this.distube.play(voiceChannel, song, options);
    } catch (e) {
      if (ENV.BOT_VERBOSE_LOGGING) loggerError(e);
      await textChannel.send({ embeds: [generateErrorEmbed(i18next.t('audioplayer:play_error'))] });
    }
  }

  async stop(guild: Guild) {
    if (this.distube.getQueue(guild)) {
      await this.distube.stop(guild);
    } else {
      await this.distube.voices.leave(guild);
    }
    await this.playersManager.remove(guild.id);
  }

  async pause(guild: Guild) {
    const queue = this.distube.getQueue(guild);
    if (!queue) return;
    const player = this.playersManager.get(queue.id);
    if (!player) return;
    if (queue.paused) {
      await this.distube.resume(guild);
      await player.setState('playing');
    } else {
      await this.distube.pause(guild);
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
        await queue.setRepeatMode(RepeatMode.SONG);
        player.embedBuilder.setLoopMode('song');
        break;
      case RepeatMode.SONG:
        await queue.setRepeatMode(RepeatMode.QUEUE);
        player.embedBuilder.setLoopMode('queue');
        break;
      case RepeatMode.QUEUE:
        await queue.setRepeatMode(RepeatMode.DISABLED);
        player.embedBuilder.setLoopMode('disabled');
        break;
    }

    await player.update();
  }

  async skip(guild: Guild): Promise<Song | undefined> {
    try {
      const queue = this.distube.getQueue(guild);
      if (queue) {
        await this.distube.skip(guild);
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
      await this.distube.seek(guild, time);
      await player.setState('playing');
      return true;
    } catch (e) {
      return false;
    }
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

      return new EmbedBuilder()
        .setAuthor({ name: `${i18next.t('audioplayer:show_queue_songs_in_queue')}: ` })
        .setTitle(queue.songs[0].name!)
        .setURL(queue.songs[0].url)
        .setDescription(
          `**${i18next.t('audioplayer:show_queue_title')}: **\n${queueList}`.slice(0, 4096)
        );
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

  private setupEvents() {
    this.distube
      .on('empty', async (queue) => {
        await queue.textChannel?.send(i18next.t('audioplayer:event_empty') as string);
        await this.playersManager.remove(queue.id);
      })
      .on('initQueue', async (queue) => {
        await this.playersManager.add(queue.id, queue.textChannel as TextChannel, queue);

        const player = this.playersManager.get(queue.id);
        if (player) {
          await player.init();
        }
      })
      .on('playSong', async (queue) => {
        const player = this.playersManager.get(queue.id);
        if (player) {
          await player.setState('playing');
        }
      })
      .on('disconnect', async (queue) => {
        await this.playersManager.remove(queue.id);
      })
      .on('addSong', async (queue, song) => {
        if (queue.textChannel) {
          await queue.textChannel.send({ embeds: [generateAddedSongMessage(song)] });
        }

        const player = this.playersManager.get(queue.id);
        if (player) {
          await player.update();
        }
      })
      .on('addList', async (queue, playlist) => {
        if (queue.textChannel) {
          await queue.textChannel.send({ embeds: [generateAddedPlaylistMessage(playlist)] });
        }

        const player = this.playersManager.get(queue.id);
        if (player) {
          await player.update();
        }
      })
      .on('finishSong', async (queue) => {
        if (!this.playersManager.has(queue.id)) return;
        if (queue._next || queue._prev || queue.stopped || queue.songs.length > 1) return;
        this.playersManager.get(queue.id)?.setState('waiting');
      })
      .on('error', async (channel, error) => {
        channel?.send({
          embeds: [
            generateErrorEmbed(`${error.name} + \n\n + ${error.message} \n\n + ${error.stack}`)
          ]
        });
      });
  }
}

function generateAddedSongMessage(song: Song) {
  return new EmbedBuilder()
    .setTitle(song.name ?? i18next.t('audioplayer:player_embed_unknown'))
    .setURL(song.url ?? null)
    .setAuthor({ name: `🎵${i18next.t('audioplayer:event_add_song')}🎵` })
    .setThumbnail(song.thumbnail ?? null)
    .addFields(
      {
        name: `${i18next.t('audioplayer:player_embed_requester')}`,
        value: `${song.member!.user.toString()}`,
        inline: true
      },
      {
        name: `${i18next.t('audioplayer:event_add_song_length')}`,
        value: `\`${song.formattedDuration}\``,
        inline: true
      },
      {
        name: `${i18next.t('audioplayer:event_add_song_author')}`,
        value: `\`${song.uploader.name ?? i18next.t('audioplayer:player_embed_unknown')}\``,
        inline: true
      }
    );
}

function generateAddedPlaylistMessage(playlist: Playlist) {
  return new EmbedBuilder()
    .setTitle(playlist.name ?? i18next.t('audioplayer:player_embed_unknown'))
    .setURL(playlist.url ?? null)
    .setAuthor({ name: `🎵${i18next.t('audioplayer:event_add_list')}🎵` })
    .setThumbnail(playlist.thumbnail ?? null)
    .addFields(
      {
        name: `${i18next.t('audioplayer:player_embed_requester')}`,
        value: `${playlist.member!.user.toString()}`,
        inline: true
      },
      {
        name: `${i18next.t('audioplayer:event_add_list_songs_count')}`,
        value: `\`${playlist.songs.length}\``,
        inline: true
      },
      {
        name: `${i18next.t('audioplayer:event_add_song_length')}`,
        value: `\`${playlist.formattedDuration}\``,
        inline: true
      }
    );
}
