const ytdl = require('ytdl-core')
const fs = require('fs')
const { Song } = require('distube')
const { getData } = require('spotify-url-info')

/**
 * Скачивает на хостинг выбранную песню и возвращает ошибку в виде строки или результат
 * @param song
 */

async function downloadSong (song) {
  if (song.isLive) {
    return 'songIsLive'
  }

  const fileName = `${song.name.replaceAll(/[&/\\#,+()$~%.'":*?<>|{}]/g, '')}.mp3`

  const fileStream = await fs.createWriteStream(fileName)

  // Оборачиваем скачивание в промис, потому-что на .pipe не работает async/await
  return await new Promise((resolve) => { // wait
    ytdl(song.url, { filter: 'audioonly', format: 'mp3', quality: 'lowestaudio' })
      .pipe(fileStream)
      .on('finish', async function () {
        try {
          await fs.rename(fileStream.path, fileName, err => { if (err) throw err })
          const stats = fs.statSync(fileName)
          if (stats.size >= 8388608) {
            await deleteSongFile(fileName)
            resolve('songIsTooLarge')
          } else {
            resolve(fileName)
          }
        } catch (e) {
          await deleteSongFile(fileName)
          resolve('undefinedError')
        }
      })
  })
}

async function deleteSongFile (filename) {
  fs.unlink(filename, err => { if (err) throw err })
}

async function searchSong (request) {
  let songData
  if (request.startsWith('https://www.youtube.com')) {
    return new Song(await ytdl.getBasicInfo(request))
  } else {
    let query
    await getData(request).then(async data => {
      query = data.name
    })

    try {
      songData = await this.distube.search(query, { limit: 1, type: 'video' }).then(function (result) {
        return result[0]
      })
      return songData
    } catch (e) {
      return undefined
    }
  }
}

module.exports = { downloadSong, deleteSongFile, searchSong }
