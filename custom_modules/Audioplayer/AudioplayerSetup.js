const DisTubeLib = require('distube')
const config = require('config')
const { SpotifyPlugin } = require('@distube/spotify')
const { YtDlpPlugin } = require('@distube/yt-dlp')
const { SoundCloudPlugin } = require('@distube/soundcloud')
const { PLAYER_FIELDS, PLAYER_STATES, editField, pushChangesToPlayerMessage, stopPlayer, setPlayerEmbedState } = require('./Audioplayer')

module.exports.PlayerInitSetup = (client) => {
  global.musicPlayerMap = {}

  // eslint-disable-next-line new-cap
  const distube = new DisTubeLib.default(client, {
    searchSongs: 0,
    leaveOnEmpty: true,
    emptyCooldown: 30,
    leaveOnFinish: true,
    leaveOnStop: true,
    youtubeDL: false,
    updateYouTubeDL: false,
    youtubeCookie: config.get('YOUTUBE_COOKIE'),

    plugins: [
      new SpotifyPlugin(
        {
          parallel: true,
          emitEventsAfterFetching: true,
          api: {
            clientId: config.get('SPOTIFY_CLIENT_ID'),
            clientSecret: config.get('SPOTIFY_CLIENT_SECRET')
          }
        }),
      new YtDlpPlugin(),
      new SoundCloudPlugin()
    ]
  })

  distube
    .on('error', async (textChannel, e) => {
      if (e.errorCode === 'UNAVAILABLE_VIDEO') {
        await textChannel.send('Это видео недоступно из-за жестокости')
        if (distube.getQueue(textChannel.guild)) {
          await distube.skip(textChannel.guild)
        }
        return
      }
      console.error(e)
      textChannel.send(`Произошла ошибка: ${e.stack}`.slice(0, 2000))
    })
    .on('playSong', async (musicQueue, song) => {
      const guild = musicQueue.textChannel.guildId
      await setPlayerEmbedState(guild, PLAYER_STATES.playing)
      editField(guild, PLAYER_FIELDS.author, song.uploader.name)
      editField(guild, PLAYER_FIELDS.duration, song.formattedDuration)
      editField(guild, PLAYER_FIELDS.queue_duration, musicQueue.formattedDuration)
      editField(guild, PLAYER_FIELDS.remaining_songs, (musicQueue.songs.length - 1).toString())
      await musicPlayerMap[guild].PlayerEmbed.setThumbnail(song.thumbnail).setTitle(song.name).setURL(song.url)
      await pushChangesToPlayerMessage(guild, musicQueue)
    })
    .on('addSong', async (musicQueue, song) => {
      const guild = musicQueue.textChannel.guildId
      await musicQueue.textChannel.send({
        content:
                    `Добавлено: ${song.name} - \`${song.formattedDuration}\` в очередь по запросу \`${song.member.user.username}\``
      })
      editField(guild, PLAYER_FIELDS.queue_duration, musicQueue.formattedDuration)
      editField(guild, PLAYER_FIELDS.remaining_songs, (musicQueue.songs.length - 1).toString())
      await pushChangesToPlayerMessage(musicQueue.textChannel.guildId, musicQueue)
    })
    .on('addList', async (musicQueue, playlist) => {
      musicQueue.textChannel.send({
        content:
                    `Добавлено \`${playlist.songs.length}\` песен из плейлиста \`${playlist.name}\` в очередь по запросу \`${playlist.member.user.username}\``
      })
      const guild = musicQueue.textChannel.guildId
      editField(guild, PLAYER_FIELDS.queue_duration, musicQueue.formattedDuration)
      editField(guild, PLAYER_FIELDS.remaining_songs, (musicQueue.songs.length - 1).toString())
      await pushChangesToPlayerMessage(musicQueue.textChannel.guildId, musicQueue)
    })
    .on('finishSong', async musicQueue => {
      const guild = musicQueue.textChannel.guildId
      if (!musicQueue.next) {
        await setPlayerEmbedState(guild, PLAYER_STATES.waiting)
        if (!musicPlayerMap[guild]) { return }
        await pushChangesToPlayerMessage(guild, musicQueue)
      }
    })
    .on('disconnect', async musicQueue => {
      await stopPlayer(distube, musicQueue.textChannel.guild)
    })

  return distube
}
