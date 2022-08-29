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

class AudioPlayerModule {
  constructor (client, options = {}) {
    this.client = client
    this.musicPlayerMap = {}
    // eslint-disable-next-line new-cap
    this.distube = new DisTubeLib.default(client, {
      leaveOnEmpty: true,
      emptyCooldown: 20,
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
  }

  setupEvents () {
    this.distube
      .on('disconnect', async musicQueue => {
        await this.actions.stop(musicQueue.textChannel.guild)
      })
      .on('error', (channel, error) => {
        loggerSend(error)
        channel.send(`An error encoutered: ${error.slice(0, 1979)}`) // Discord limits 2000 characters in a message
      })

    this.playerEmitter
      .on('destroyPlayer', async (guild) => {
        await this.clearPlayerState(guild)
      })
      .on('stopPlayer', async (guild) => {
        await this.actions.stop(guild)
      })
      .on('songSkipped', async (guild) => {
        await this.actions.skipSong(guild)
      })
      .on('playerSwitchPauseAndResume', async (guild) => {
        await this.actions.switchPauseAndResume(guild)
      })
      .on('playerResume', async (guild) => {
        await this.actions.resume(guild)
      })
      .on('playerPause', async (guild) => {
        await this.actions.pause(guild)
      })
      .on('requestSwitchRepeatMode', async (guild) => {
        await this.actions.changeRepeatMode(guild)
      })
      .on('queueJump', async (guild, queuePosition) => {
        await this.actions.jump(guild, queuePosition)
      })
      .on('requestDeleteSong', async (guild, queuePosition, username) => {
        await this.actions.deleteSongFromQueue(guild, queuePosition, username)
      })
      .on('queueShuffle', async (guild) => {
        await this.actions.shuffle(guild)
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
   * Отправляет в чат текущую проигрываемую песню и позицию времени
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
