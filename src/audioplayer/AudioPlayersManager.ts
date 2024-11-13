import { AudioPlayersStore } from './AudioPlayersStore.js';
import { generateErrorEmbed } from '../utilities/generateErrorEmbed.js';
import i18next from 'i18next';
import { loggerError, loggerSend } from '../utilities/logger.js';
import { ENV } from '../EnvironmentVariables.js';
import { generateAddedPlaylistMessage } from './util/generateAddedPlaylistMessage.js';
import { generateAddedSongMessage } from './util/generateAddedSongMessage.js';
import {
  ButtonInteraction,
  Client,
  EmbedBuilder,
  Guild,
  GuildMember,
  GuildTextBasedChannel,
  Interaction,
  TextChannel,
  VoiceBasedChannel
} from 'discord.js';
import { generateWarningEmbed } from '../utilities/generateWarningEmbed.js';
import { generateLyricsEmbed } from './Lyrics.js';
import { getGuildOptionLeaveOnEmpty, setGuildOptionLeaveOnEmpty } from '../schemas/SchemaGuild.js';
import { addSongToGuildSongsHistory } from '../schemas/SchemaSongsHistory.js';
import { PaginationList } from './PaginationList.js';
import { Node, nodeResponse, Player, Queue, Riffy, RiffyEventType, Track } from 'riffy';
import { LavaNodes } from '../LavalinkNodes.js';
import { clamp } from '../utilities/clamp.js';
import { formatMilliseconds } from '../utilities/formatMillisecondsToTime.js';
import { isValidURL } from '../utilities/isValidURL.js';
import * as process from 'node:process';
import * as util from 'node:util';

export const loggerPrefixAudioplayer = `Audioplayer`;

export class AudioPlayersManager {
  client: Client;
  playersManager: AudioPlayersStore;
  riffy: Riffy;
  constructor(client: Client) {
    this.client = client;
    this.client.audioPlayer = this;
    this.playersManager = new AudioPlayersStore(this.client);
    this.riffy = new Riffy(this.client, LavaNodes, {
      send: (payload) => {
        const guild = client.guilds.cache.get(payload.d.guild_id);
        if (guild) guild.shard.send(payload);
      },
      defaultSearchPlatform: 'ytmsearch',
      restVersion: 'v4',
      multipleTrackHistory: true
    });

    this.setupEvents();
  }

  async play(
    voiceChannel: VoiceBasedChannel,
    textChannel: TextChannel,
    query: string | nodeResponse,
    member: GuildMember
  ): Promise<void> {
    try {
      const riffyPlayer: Player = this.riffy.createConnection({
        guildId: textChannel.guild.id,
        voiceChannel: voiceChannel.id,
        textChannel: textChannel.id,
        deaf: true
      });

      const player = this.playersManager.get(textChannel.guild.id);

      const resolve: nodeResponse | undefined =
        typeof query === 'string' ? await this.resolve(query, member.id) : query;
      if (!resolve) return;

      if (resolve.loadType === 'playlist') {
        if (!resolve.playlistInfo) return;

        for (const track of resolve.tracks) {
          riffyPlayer.queue.add(track);
        }

        if (player) {
          if (riffyPlayer.textChannel) {
            await player.textChannel.send({ embeds: [generateAddedPlaylistMessage(resolve)] });

            if (riffyPlayer.queue.length >= ENV.BOT_MAX_SONGS_IN_QUEUE) {
              await player.textChannel.send({
                embeds: [
                  generateWarningEmbed(
                    i18next.t('audioplayer:event_add_list_limit', {
                      queueLimit: ENV.BOT_MAX_SONGS_IN_QUEUE
                    }) as string
                  )
                ]
              });
              // Concat songs count in queue to BOT_MAX_SONGS_IN_QUEUE
              riffyPlayer.queue.length = ENV.BOT_MAX_SONGS_IN_QUEUE;
            }
          }
          await player.update();
        } else {
          await textChannel.send({ embeds: [generateAddedPlaylistMessage(resolve)] });
        }

        if (ENV.BOT_MAX_SONGS_HISTORY_SIZE > 0) {
          //await addSongToGuildSongsHistory(queue.id, playlist);
        }

        if (!riffyPlayer.playing && !riffyPlayer.paused) await riffyPlayer.play();
      } else if (resolve.loadType === 'search' || resolve.loadType === 'track') {
        const track = resolve.tracks.shift();
        if (!track) return;

        if (ENV.BOT_MAX_SONGS_HISTORY_SIZE > 0) {
          //await addSongToGuildSongsHistory(textChannel.guild.id, track);
        }

        if (player) {
          if (riffyPlayer.textChannel) {
            await player.textChannel.send({ embeds: [generateAddedSongMessage(track)] });
          }
          await player.update();
        } else {
          await textChannel.send({ embeds: [generateAddedSongMessage(track)] });
        }

        riffyPlayer.queue.add(track);

        if (!riffyPlayer.playing && !riffyPlayer.paused) await riffyPlayer.play();
      } else {
        await textChannel.send(`There were no results found for your query.`);
      }
    } catch (e) {
      if (ENV.BOT_VERBOSE_LOGGING) loggerError(e);
      await textChannel.send({
        embeds: [generateErrorEmbed(`${query}\n${e.message}`, i18next.t('audioplayer:play_error') as string)]
      });
    }
  }

  async resolve(query: string, memberId: string): Promise<nodeResponse | undefined> {
    const resolve: nodeResponse = await this.riffy.resolve({ query, requester: memberId });

    if (resolve.loadType === 'playlist') {
      if (!resolve.playlistInfo) return undefined;

      for (const track of resolve.tracks) {
        track.info.requester = memberId;
      }
    } else if (resolve.loadType === 'search' || resolve.loadType === 'track') {
      const track = resolve.tracks[0];
      if (!track) return undefined;
      track.info.requester = memberId;
    }

    return resolve;
  }

  async stop(guildId: string): Promise<void> {
    const riffyPlayer = this.riffy.players.get(guildId);
    if (!riffyPlayer) return;
    riffyPlayer.destroy();
    await this.playersManager.remove(guildId);
  }

  async pause(guild: Guild): Promise<void> {
    const riffyPlayer = this.riffy.players.get(guild.id);
    if (!riffyPlayer) return;
    const player = this.playersManager.get(guild.id);
    if (!player) return;
    if (!riffyPlayer.paused) {
      riffyPlayer.pause(true);
      await player.setState('pause');
    }

    await player.update();
  }

  async resume(guild: Guild): Promise<void> {
    const riffyPlayer = this.riffy.players.get(guild.id);
    if (!riffyPlayer) return;
    const player = this.playersManager.get(guild.id);
    if (!player) return;
    if (riffyPlayer.paused) {
      riffyPlayer.pause(false);
      await player.setState('playing');
    }

    await player.update();
  }

  async pauseResume(guild: Guild): Promise<void> {
    const riffyPlayer = this.riffy.players.get(guild.id);

    if (!riffyPlayer) return;
    const player = this.playersManager.get(guild.id);
    if (!player) return;
    if (riffyPlayer.paused) {
      await this.resume(guild);
    } else {
      await this.pause(guild);
    }

    await player.update();
  }

  async changeLoopMode(guild: Guild): Promise<void> {
    const riffyPlayer = this.riffy.players.get(guild.id);

    if (!riffyPlayer) return;
    const player = this.playersManager.get(guild.id);
    if (!player) return;

    switch (riffyPlayer.loop) {
      case 'none':
        riffyPlayer.setLoop('track');
        player.embedBuilder.setLoopMode('song');
        break;
      case 'track':
        riffyPlayer.setLoop('queue');
        player.embedBuilder.setLoopMode('queue');
        break;
      case 'queue':
        riffyPlayer.setLoop('none');
        player.embedBuilder.setLoopMode('disabled');
        break;
    }

    await player.update();
  }

  async skip(guild: Guild): Promise<Track | undefined | null> {
    try {
      const riffyPlayer = this.riffy.players.get(guild.id);
      if (!riffyPlayer) return;

      const current_song = riffyPlayer.current;
      // I don`t know why stop(), but Riffy Player don`t have method skip()
      riffyPlayer.stop();
      return current_song;
    } catch (e) {
      if (ENV.BOT_VERBOSE_LOGGING) loggerError(e);
    }
    return undefined;
  }

  async shuffle(guild: Guild): Promise<Queue | undefined> {
    const riffyPlayer = this.riffy.players.get(guild.id);
    if (!riffyPlayer) return;

    try {
      const queue = riffyPlayer.queue;
      queue.shuffle();
      const player = this.playersManager.get(guild.id);
      if (!player) return undefined;
      await player.update();
      return queue;
    } catch (e) {
      if (ENV.BOT_VERBOSE_LOGGING) loggerError(e);
    }
    return undefined;
  }

  // TODO: Implement Jump in audioplayer
  async jump(guild: Guild, position: number): Promise<Track | undefined> {
    try {
      const riffyPlayer = this.riffy.players.get(guild.id);
      if (!riffyPlayer) return;
      const jumpTrack = riffyPlayer.queue.at(position);
      riffyPlayer.queue.splice(
        0 /* At Position */,
        clamp(position, 1, riffyPlayer.queue.length - 1) /* Tracks to jump */
      );
      riffyPlayer.stop();
      return jumpTrack;
    } catch (e) {
      if (ENV.BOT_VERBOSE_LOGGING) loggerError(e);
    }

    return undefined;
  }

  async previous(guild: Guild): Promise<Track | undefined> {
    try {
      const riffyPlayer = this.riffy.players.get(guild.id);
      if (!riffyPlayer) return;
      const previousSong = riffyPlayer.previous;
      if (!previousSong) return undefined;
      riffyPlayer.queue.unshift(previousSong);
      riffyPlayer.stop();
      return previousSong;
    } catch (e) {
      if (ENV.BOT_VERBOSE_LOGGING) loggerError(e);
    }

    return undefined;
  }

  async seek(guild: Guild, ms: number): Promise<boolean> {
    try {
      const riffyPlayer = this.riffy.players.get(guild.id);
      if (!riffyPlayer) return false;
      const player = this.playersManager.get(guild.id);
      if (!player) return false;
      if (ms < 0) ms = 0;
      riffyPlayer.seek(ms);
      await player.setState('playing');
      return true;
    } catch {
      return false;
    }
  }

  async showLyrics(interaction: ButtonInteraction) {
    await interaction.reply({ content: 'undefined' });
    /*
    if (!interaction.guild) return;
    const queue = this.distube.getQueue(interaction.guild);
    if (!queue) {
      return;
    }

    const song = queue.songs[0];

    await interaction.reply({ embeds: [await generateLyricsEmbed(song.name!)] });

     */
  }

  async showQueue(interaction: ButtonInteraction): Promise<void> {
    if (!interaction.guild) return;
    const riffyPlayer = this.riffy.players.get(interaction.guildId!);
    if (!riffyPlayer) return;

    function buildPage(queue: Queue, pageNumber: number, entriesPerPage: number) {
      let queueList = '';

      const startingIndex = pageNumber * entriesPerPage;

      for (let i = startingIndex; i < Math.min(startingIndex + entriesPerPage, queue.length); i++) {
        const song = queue[i];
        queueList +=
          `${i + 1}. ` + `[${song.info.title}](${song.info.uri})` + ` - \`${formatMilliseconds(song.info.length)}\`\n`;
      }

      const page = new EmbedBuilder()
        .setAuthor({ name: `${i18next.t('audioplayer:show_queue_songs_in_queue')}: ` })
        .setTitle(riffyPlayer?.current.info.title ?? null)
        .setDescription(`**${i18next.t('audioplayer:show_queue_title')}: **\n${queueList}`.slice(0, 4096));

      page.setURL(riffyPlayer?.current.info.uri ?? null);

      return page;
    }

    const arrayEmbeds: Array<EmbedBuilder> = [];
    const entriesPerPage = 20;
    const pages = Math.ceil(riffyPlayer.queue.length / entriesPerPage);

    for (let i = 0; i < pages; i++) {
      arrayEmbeds.push(buildPage(riffyPlayer.queue, i, entriesPerPage));
    }

    // @ts-expect-error ButtonInteraction have method reply(),
    // but it have differences with reply() in MessageInteraction so we get error
    await PaginationList(interaction, arrayEmbeds, interaction.user);
  }

  async setLeaveOnEmpty(guild: Guild, mode: boolean) {
    await setGuildOptionLeaveOnEmpty(guild.id, mode);

    const player = this.playersManager.get(guild.id);
    if (!player) return;
    await player.setLeaveOnEmpty(mode);
  }

  private setupEvents() {
    this.riffy.on(RiffyEventType.NodeConnect, async (node) => {
      loggerSend(`Node ${node.name} has connected.`, loggerPrefixAudioplayer);
    });

    this.riffy.on(RiffyEventType.NodeError, async (node, error) => {
      // @ts-expect-error When Lavalink node found the error, we have field "code" in class "error"
      if (error.code === 'ECONNREFUSED') {
        loggerSend(`Node ${node.name} failed to connect: ${error.message}`, loggerPrefixAudioplayer);
        process.exit(1);
      } else {
        loggerSend(`Node ${node.name} encountered an error: ${error.message}`, loggerPrefixAudioplayer);
      }
    });

    if (ENV.BOT_VERBOSE_LOGGING) {
      this.riffy.on(RiffyEventType.Debug, async (message) => {
        loggerSend(`Riffy Debug: ${message}`, loggerPrefixAudioplayer);
      });
    }

    this.riffy.on(RiffyEventType.PlayerCreate, async (riffyPlayer) => {
      const guildTextChannel = this.client.channels.cache.get(riffyPlayer.textChannel) as GuildTextBasedChannel;
      await this.playersManager.add(riffyPlayer.guildId, guildTextChannel, this.riffy);

      const player = this.playersManager.get(riffyPlayer.guildId);
      if (!player) return;

      await player.init();
      await player.setLeaveOnEmpty(await getGuildOptionLeaveOnEmpty(riffyPlayer.guildId));
    });

    this.riffy.on(RiffyEventType.PlayerDisconnect, async (riffyPlayer) => {
      await this.playersManager.remove(riffyPlayer.guildId);
    });

    this.riffy.on(RiffyEventType.TrackStart, async (riffyPlayer, track, payload) => {
      const player = this.playersManager.get(riffyPlayer.guildId);
      if (player) {
        await player.setState('playing');
      }
    });

    this.riffy.on(RiffyEventType.QueueEnd, async (riffyPlayer) => {
      await this.playersManager.get(riffyPlayer.guildId)?.setState('waiting');
    });
  }
}
