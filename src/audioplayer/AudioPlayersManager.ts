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
      const riffyPlayer: Player = this.riffy.createConnection({
        guildId: textChannel.guild.id,
        voiceChannel: voiceChannel.id,
        textChannel: textChannel.id,
        deaf: true
      });

      const player = this.playersManager.get(textChannel.guild.id);

      const resolve: nodeResponse = await this.riffy.resolve({ query, requester: member.id });

      if (resolve.loadType === 'playlist') {
        if (!resolve.playlistInfo) return;

        for (const track of resolve.tracks) {
          track.info.requester = member;
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
        track.info.requester = member;

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
    this.riffy.on('nodeConnect', async (node) => {
      loggerSend(`Node ${node.name} has connected.`, loggerPrefixAudioplayer);
    });

    this.riffy.on('nodeError', async (node, error) => {
      loggerSend(`Node ${node.name} encountered an error: ${error.message}`, loggerPrefixAudioplayer);
    });

    if (ENV.BOT_VERBOSE_LOGGING) {
      this.riffy.on('debug', async (message) => {
        loggerSend(`Riffy Debug: ${message}`, loggerPrefixAudioplayer);
      });
    }

    this.riffy.on('playerCreate', async (riffyPlayer) => {
      const guildTextChannel = this.client.channels.cache.get(riffyPlayer.textChannel) as GuildTextBasedChannel;
      await this.playersManager.add(riffyPlayer.guildId, guildTextChannel, this.riffy);

      const player = this.playersManager.get(riffyPlayer.guildId);
      if (!player) return;

      await player.init();
      await player.setLeaveOnEmpty(await getGuildOptionLeaveOnEmpty(riffyPlayer.guildId));
    });

    this.riffy.on('playerDisconnect', async (riffyPlayer) => {
      await this.playersManager.remove(riffyPlayer.guildId);
    });

    this.riffy.on('trackStart', async (riffyPlayer, track, payload) => {
      const player = this.playersManager.get(riffyPlayer.guildId);
      if (player) {
        await player.setState('playing');
      }
    });

    this.riffy.on('queueEnd', async (riffyPlayer) => {
      await this.playersManager.get(riffyPlayer.guildId)?.setState('waiting');
    });
  }
}
