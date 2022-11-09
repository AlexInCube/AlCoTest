const DisTubeLib = require('distube')
const { SpotifyPlugin } = require('@distube/spotify')
const { YtDlpPlugin } = require('@distube/yt-dlp')
const { SoundCloudPlugin } = require('@distube/soundcloud')
const { EmbedBuilder } = require('discord.js')
const { filledBar } = require('string-progressbar')
const { DiscordGui } = require('./AudioPlayerDiscordGui')
const { AudioPlayerActions } = require('./AudioPlayerActions')
const events = require('events')
const { loggerSend } = require('../../utilities/logger')
const { AudioPlayerEvents } = require('./AudioPlayerEvents')

class AudioPlayerModule {
  constructor (client, options = {}) {
    this.client = client
    this.musicPlayerMap = {}
    // eslint-disable-next-line new-cap
    this.distube = new DisTubeLib.default(client, {
      leaveOnEmpty: true,
      emptyCooldown: process.env.NODE_ENV === 'production' ? 20 : 999,
      leaveOnFinish: true,
      leaveOnStop: true,
      youtubeCookie: options.ytcookie || undefined,
      joinNewVoiceChannel: true,
      nsfw: true,
      emitAddListWhenCreatingQueue: true,
      emitAddSongWhenCreatingQueue: true,
      plugins: [
        new SpotifyPlugin(
          {
            parallel: true,
            emitEventsAfterFetching: true,
            api: {
              clientId: options.spotify.clientId || undefined,
              clientSecret: options.spotify.clientSecret || undefined
            }
          }),
        new YtDlpPlugin({
          update: false
        }),
        new SoundCloudPlugin()
      ]
    })
    this.playerEmitter = new events.EventEmitter()
    this.actions = new AudioPlayerActions(this.musicPlayerMap, this.distube, this.playerEmitter, client)
    this.discordGui = new DiscordGui(this.musicPlayerMap, this.distube, this.playerEmitter, client)
    this.setupEvents()

    this.distube.setMaxListeners(2)
  }

  setupEvents () {
    this.distube
      .on('disconnect', async musicQueue => {
        this.playerEmitter.emit(AudioPlayerEvents.requestStopPlayer, musicQueue.textChannel.guild)
      })
      .on('error', (channel, error) => {
        loggerSend(error)
        channel.send(`An error encoutered: ${error}`.slice(0, 2000))
      })

    this.playerEmitter
      .on(AudioPlayerEvents._destroyPlayer, async (guild) => {
        await this.clearPlayerState(guild)
      })
      .on(AudioPlayerEvents.requestStopPlayer, async (guild) => {
        await this.actions.stop(guild)
      })
      .on(AudioPlayerEvents.requestSongSkip, async (guild, username) => {
        await this.actions.skipSong(guild, username)
      })
      .on(AudioPlayerEvents.requestTogglePauseAndResume, async (guild) => {
        await this.actions.switchPauseAndResume(guild)
      })
      .on(AudioPlayerEvents.requestPlayerResume, async (guild) => {
        await this.actions.resume(guild)
      })
      .on(AudioPlayerEvents.requestPlayerPause, async (guild) => {
        await this.actions.pause(guild)
      })
      .on(AudioPlayerEvents.requestToggleRepeatMode, async (guild) => {
        await this.actions.changeRepeatMode(guild)
      })
      .on(AudioPlayerEvents.requestQueueJump, async (guild, queuePosition, username) => {
        await this.actions.jump(guild, queuePosition, username)
      })
      .on(AudioPlayerEvents.requestDeleteSong, async (guild, queuePosition, username) => {
        await this.actions.deleteSongFromQueue(guild, queuePosition, username)
      })
      .on(AudioPlayerEvents.requestQueueShuffle, async (guild, username) => {
        await this.actions.shuffle(guild, username)
      })
      .on(AudioPlayerEvents.requestChangeSongTime, async (guild, time, username) => {
        await this.actions.position(guild, time, username)
      })
  }

  /**
   * Получение текущей очереди на сервере
   * @param guild
   * @returns Queue
   */
  getQueue (guild) {
    return this.distube.getQueue(guild)
  }

  async playerIsExists (interaction) {
    if (this.getQueue(interaction.guild) === undefined) {
      await interaction.reply({ content: 'Плеера не существует', ephemeral: true })
      return false
    }
    return true
  }

  /**
   * Очищает память от плеера
   * @param guild
   */
  async clearPlayerState (guild) {
    if (this.musicPlayerMap[guild.id]) {
      await this.musicPlayerMap[guild.id].Collector.stop()
      const playerMessage = await this.discordGui.getPlayerMessageInGuild(guild)
      if (playerMessage !== undefined) {
        playerMessage.delete()
      }
      delete this.musicPlayerMap[guild.id]
    }
  }

  /**
   * Отправляет в чат текущую проигрываемую песню и временной отрезок
   * @param interaction
   */
  async getCurrentPlayingMessage (interaction) {
    const queue = this.getQueue(interaction.guild)

    const progressBar = filledBar(queue.duration, queue.currentTime, 40, '-', '=')
    const durationString = queue.formattedCurrentTime + ` ${progressBar[0]} ` + queue.formattedDuration

    const playingEmbed = new EmbedBuilder()
      .setTitle(queue.songs[0].name)
      .setURL(queue.songs[0].url)
      .setDescription(durationString)

    await interaction.reply({ embeds: [playingEmbed], ephemeral: true })
  }
}

module.exports = { AudioPlayerModule }
