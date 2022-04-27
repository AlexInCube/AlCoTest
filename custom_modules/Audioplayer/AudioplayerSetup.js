const DisTubeLib = require('distube')
const Discord = module.require('discord.js')
const config = require('config')
const { SpotifyPlugin } = require('@distube/spotify')
const { YtDlpPlugin } = require('@distube/yt-dlp')
const { SoundCloudPlugin } = require('@distube/soundcloud')
const {
  PLAYER_STATES, pushChangesToPlayerMessage, stopPlayer, setPlayerEmbedState, createPlayer,
  updateEmbedWithSong
} = require('./Audioplayer')

module.exports.PlayerInitSetup = (client) => {
  global.musicPlayerMap = {}

  // eslint-disable-next-line new-cap
  const distube = new DisTubeLib.default(client, {
    searchSongs: 10,
    searchCooldown: 30,
    leaveOnEmpty: true,
    emptyCooldown: 20,
    leaveOnFinish: true,
    leaveOnStop: true,
    youtubeDL: false,
    updateYouTubeDL: false,
    youtubeCookie: config.get('YOUTUBE_COOKIE'),
    nsfw: true,
    emitAddListWhenCreatingQueue: true,
    emitAddSongWhenCreatingQueue: true,
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
      if (!musicPlayerMap[musicQueue.textChannel.guildId]) return
      await updateEmbedWithSong(musicQueue, song)
      await pushChangesToPlayerMessage(musicQueue.textChannel.guildId, musicQueue)
    })
    .on('addSong', async (musicQueue, song) => {
      await musicQueue.textChannel.send({
        content: `Добавлено: ${song.name} - \`${song.formattedDuration}\` в очередь по запросу \`${song.member.user.username}\``
      })
      await createPlayer(client, musicQueue, distube)
      await updateEmbedWithSong(musicQueue, musicQueue.songs[0])
      await pushChangesToPlayerMessage(musicQueue.textChannel.guildId, musicQueue)
    })
    .on('addList', async (musicQueue, playlist) => {
      musicQueue.textChannel.send({
        content:
                    `Добавлено \`${playlist.songs.length}\` песен из плейлиста \`${playlist.name}\` в очередь по запросу \`${playlist.member.user.username}\``
      })
      await createPlayer(client, musicQueue, distube)
      await updateEmbedWithSong(musicQueue, musicQueue.songs[0])
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
    .on('searchResult', async (userMessage, results) => {
      let resultsFormattedList = ''// Превращаем список в то что можно вывести в сообщение

      results.forEach((item, index) => { // Перебираем все песни в списке и превращаем в вывод для отображения результата поиска
        resultsFormattedList += `**${index + 1}**.  ` + `[${item.name}](${item.url})` + ' — ' + ` \`${item.formattedDuration}\` ` + '\n'
      })

      const resultsEmbed = new Discord.MessageEmbed()
        .setColor('#436df7')
        .setAuthor({ name: '🔍 Результаты поиска 🔎' })
        .setTitle('Напишите число песни (без префикса //), чтобы выбрать её, у вас есть 30 секунд!')
        .setDescription(resultsFormattedList)

      await userMessage.channel.send({ embeds: [resultsEmbed] })
    }
    )
    .on('searchNoResult', (message, query) => message.channel.send(`Ничего не найдено по запросу ${query}!`))
    .on('searchInvalidAnswer', (message) => message.channel.send('Вы указали что-то неверное, проверьте запрос!'))
    .on('searchCancel', (message) => message.channel.send('Вы ничего не выбрали, поиск отменён'))
    .on('searchDone', () => {})
  return distube
}
