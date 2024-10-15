import { AudioPlayersStore } from './AudioPlayersStore.js';
import { clamp } from '../utilities/clamp.js';
import { generateErrorEmbed } from '../utilities/generateErrorEmbed.js';
import i18next from 'i18next';
import { loggerError, loggerSend } from '../utilities/logger.js';
import { ENV } from '../EnvironmentVariables.js';
import { generateAddedPlaylistMessage } from './util/generateAddedPlaylistMessage.js';
import { generateAddedSongMessage } from './util/generateAddedSongMessage.js';
import {
  ButtonInteraction,
  Client,
  CommandInteraction,
  EmbedBuilder,
  Guild,
  GuildMember,
  Interaction,
  TextChannel,
  VoiceBasedChannel
} from 'discord.js';
import { generateWarningEmbed } from '../utilities/generateWarningEmbed.js';
import { generateLyricsEmbed } from './Lyrics.js';
import { getGuildOptionLeaveOnEmpty, setGuildOptionLeaveOnEmpty } from '../schemas/SchemaGuild.js';
import { addSongToGuildSongsHistory } from '../schemas/SchemaSongsHistory.js';
import { PaginationList } from './PaginationList.js';
import { nodeResponse, Player, Queue, Riffy, Track } from 'riffy';
import { LavaNodes } from '../LavalinkNodes.js';

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
      restVersion: 'v4'
    });

    this.setupEvents();
  }

  async play(
    voiceChannel: VoiceBasedChannel,
    textChannel: TextChannel,
    query: string,
    member: GuildMember
  ): Promise<void> {
    try {
      const player: Player = this.riffy.createConnection({
        guildId: textChannel.guild.id,
        voiceChannel: voiceChannel.id,
        textChannel: textChannel.id,
        deaf: true
      });

      const resolve: nodeResponse = await this.riffy.resolve({ query, requester: member.id });
      const { loadType, tracks, playlistInfo } = resolve;

      if (loadType === 'playlist') {
        if (!playlistInfo) return;
        for (const track of resolve.tracks) {
          track.info.requester = member;
          player.queue.add(track);
        }

        await textChannel.send(`Added ${tracks.length} songs from ${playlistInfo.name} playlist.`);

        if (!player.playing && !player.paused) await player.play();
      } else if (loadType === 'search' || loadType === 'track') {
        const track = tracks.shift();
        if (!track) return;
        track.info.requester = member;

        player.queue.add(track);

        await textChannel.send(`Added **${track.info.title}** to the queue.`);

        if (!player.playing && !player.paused) await player.play();
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
      riffyPlayer.pause();
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
      await riffyPlayer.play();
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

      riffyPlayer.stop();
      return riffyPlayer.queue.first;
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
    const riffyPlayer = this.riffy.players.get(guild.id);
    if (!riffyPlayer) return;
    loggerError('Riffy JUMP is not implemented.');
    /*
    try {
      const queue = riffyPlayer.queue
      if (queue) {
        return queue. jump(guild, clamp(position, 1, queue.songs.length));
      }
    } catch (e) {
      if (ENV.BOT_VERBOSE_LOGGING) loggerError(e);
    }
    return undefined;

     */
    return undefined;
  }

  // TODO: Implement Previous in audioplayer
  async previous(guild: Guild): Promise<Track | undefined> {
    /*
    try {
      const riffyPlayer = this.riffy.players.get(guild.id);
      if (!riffyPlayer) return;
      return await riffyPlayer. .previous(guild);
    } catch (e) {
      if (ENV.BOT_VERBOSE_LOGGING) loggerError(e);
    }
    */
    return undefined;
  }

  // TODO: Implement Rewind in audioplayer
  async rewind(guild: Guild, time: number): Promise<boolean> {
    return false;
    /*
    try {
      const queue = this.distube.getQueue(guild);
      if (!queue) return false;
      const player = this.playersManager.get(queue.id);
      if (!player) return false;
      if (time < 0) time = 0;
      this.distube.seek(guild, time);
      await player.setState('playing');
      return true;
    } catch {
      return false;
    }

     */
  }

  // TODO: Implement showLyrics in audioplayer
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

  // TODO: Implement showQueue in audioplayer
  async showQueue(interaction: ButtonInteraction) {
    await interaction.reply({ content: 'undefined' });
    /*
    if (!interaction.guild) return;
    const queue = this.distube.getQueue(interaction.guild);
    if (!queue) {
      return;
    }

    function buildPage(queue: Queue, pageNumber: number, entriesPerPage: number) {
      let queueList = '';

      const startingIndex = pageNumber * entriesPerPage;

      for (let i = startingIndex; i < Math.min(startingIndex + entriesPerPage, queue.songs.length); i++) {
        const song = queue.songs[i];
        queueList += `${i + 1}. ` + `[${song.name}](${song.url})` + ` - \`${song.formattedDuration}\`\n`;
      }

      const page = new EmbedBuilder()
        .setAuthor({ name: `${i18next.t('audioplayer:show_queue_songs_in_queue')}: ` })
        .setTitle(queue.songs[0].name!)
        .setDescription(`**${i18next.t('audioplayer:show_queue_title')}: **\n${queueList}`.slice(0, 4096));

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

    await PaginationList(interaction as CommandInteraction, arrayEmbeds, interaction.user);

     */
  }

  async setLeaveOnEmpty(guild: Guild, mode: boolean) {
    await setGuildOptionLeaveOnEmpty(guild.id, mode);

    const player = this.playersManager.get(guild.id);
    if (!player) return;
    await player.setLeaveOnEmpty(mode);
  }

  private setupEvents() {
    /*
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

    this.distube.on(DistubeEvents.INIT_QUEUE, async (queue) => {
      await this.playersManager.add(queue.id, queue.textChannel as TextChannel, queue);

      const player = this.playersManager.get(queue.id);
      if (!player) return;

      await player.init();
      await player.setLeaveOnEmpty(await getGuildOptionLeaveOnEmpty(queue.id));
    });
    this.distube.on(DistubeEvents.PLAY_SONG, async (queue) => {
      const player = this.playersManager.get(queue.id);
      if (player) {
        await player.setState('playing');
      }
    });
    this.distube.on(DistubeEvents.DISCONNECT, async (queue) => {
      await this.playersManager.remove(queue.id);
    });
    this.distube.on(DistubeEvents.ADD_SONG, async (queue, song) => {
      if (queue.textChannel) {
        await queue.textChannel.send({ embeds: [generateAddedSongMessage(song)] });
      }

      if (ENV.BOT_MAX_SONGS_HISTORY_SIZE > 0) {
        await addSongToGuildSongsHistory(queue.id, song);
      }

      const player = this.playersManager.get(queue.id);
      if (player) {
        await player.update();
      }
    });
    this.distube.on(DistubeEvents.ADD_LIST, async (queue, playlist) => {
      if (ENV.BOT_MAX_SONGS_HISTORY_SIZE > 0) {
        await addSongToGuildSongsHistory(queue.id, playlist);
      }

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
    });
    this.distube.on(DistubeEvents.FINISH_SONG, async (queue) => {
      if (!this.playersManager.has(queue.id)) return;
      if (queue._next || queue._prev || queue.stopped || queue.songs.length > 1) return;
      await this.playersManager.get(queue.id)?.setState('waiting');
    });
    this.distube.on(DistubeEvents.ERROR, async (error, queue, song) => {
      let errorName = `ERROR`;
      const errorMessage = `${error.name} + \n\n + ${error.message}`;

      if (song) {
        errorName = song.name!;
      }

      if (queue.songs.length === 0) await this.stop(queue.id);

      await queue.textChannel?.send({
        embeds: [generateErrorEmbed(errorMessage, errorName)]
      });
    });

     */
  }
}
