const { MessageActionRow, MessageButton } = require('discord.js')
const voice = require('@discordjs/voice')
const { generateRandomCharacters } = require('../tools')
const { getVoiceConnection } = require('@discordjs/voice')
const fs = require('fs')
const ytdl = require('ytdl-core')
const Discord = module.require('discord.js')

/**
 * Создаёт embed сообщение с видом Аудио Плеера, но не отправляет его.
 *
 * @returns {{embeds: (Discord.MessageEmbed|Promise<Role>)[], components: MessageActionRow[]}}
 */
module.exports.createPlayerEmbed = () => {
  const musicPlayerEmbed = new Discord.MessageEmbed()// Создаём сообщение с плеером
    .setColor('#f7ee43')
    .setAuthor({ name: '⌛ Загрузка ⌛' })
    .addFields(
      { name: 'Автор', value: 'Неизвестно' },
      { name: 'Длительность песни', value: 'Неизвестно', inline: false },
      { name: 'Оставшаяся длительность очереди', value: 'Неизвестно', inline: true },
      { name: 'Осталось песен в очереди', value: 'Неизвестно', inline: true },
      { name: 'Режим повтора', value: 'Выключен', inline: true }
    )

  const musicPlayerRowPrimary = new MessageActionRow()// Создаём кнопки для плеера
    .addComponents(
      new MessageButton().setCustomId('stop_music').setLabel('Выключить').setStyle('DANGER'),
      new MessageButton().setCustomId('pause_music').setLabel('Пауза / Возобновить').setStyle('PRIMARY'),
      new MessageButton().setCustomId('toggle_repeat').setLabel('Переключить режим повтора').setStyle('PRIMARY'),
      new MessageButton().setCustomId('skip_song').setLabel('Пропустить').setStyle('PRIMARY')
    )

  const musicPlayerRowSecondary = new MessageActionRow()// Создаём кнопки для плеера
    .addComponents(
      new MessageButton().setCustomId('show_queue').setLabel('Показать очередь').setStyle('SECONDARY'),
      new MessageButton().setCustomId('download_song').setLabel('Скачать песню').setStyle('SECONDARY')
      // new MessageButton().setCustomId('show_lyrics').setLabel('Показать текст песни').setStyle('SECONDARY')
    )

  return { embeds: [musicPlayerEmbed], components: [musicPlayerRowPrimary, musicPlayerRowSecondary] }
}

module.exports.createPlayer = async (client, queue, distube) => {
  await module.exports.clearPlayerState(queue.textChannel.guild)
  const Player = module.exports.createPlayerEmbed()

  const guildId = queue.textChannel.guild.id

  const musicPlayerMessage = await queue.textChannel.send(Player) // Отправляем сообщение с плеером
  musicPlayerMap[guildId] = {
    MessageID: musicPlayerMessage.id,
    ChannelID: musicPlayerMessage.channel.id,
    PlayerEmbed: Player.embeds[0],
    Collector: ''
  }

  const filter = button => button.customId

  const collector = musicPlayerMessage.channel.createMessageComponentCollector({ filter })
  musicPlayerMap[guildId].Collector = collector

  collector.on('collect', async button => {
    // const permissions = [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.CONNECT, Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SPEAK, Permissions.FLAGS.MANAGE_MESSAGES, Permissions.FLAGS.ATTACH_FILES]
    // if (!CheckAllNecessaryPermission(client, message, permissions)) { return }

    const connection = getVoiceConnection(guildId)

    if (button.customId === 'show_queue') {
      const showQueue = distube.getQueue(button.guild)
      if (!showQueue) {
        await button.reply({ content: 'Ничего не проигрывается', ephemeral: true })
      } else {
        let queueList = ''

        let song = ''
        for (let i = 1; i < Math.min(31, showQueue.songs.length); i++) {
          song = showQueue.songs[i]
          queueList += `${i}. ` + `[${song.name}](${song.url})` + ` - \`${song.formattedDuration}\`\n`
        }

        if (showQueue.songs.length > 31) {
          queueList += `И ещё ${showQueue.songs.length - 32} песни ждут своего часа`
        }

        const queueEmbed = new Discord.MessageEmbed()
          .setAuthor({ name: 'Сейчас играет: ' })
          .setTitle(showQueue.songs[0].name).setURL(showQueue.songs[0].url)
          .setDescription(`**Оставшиеся песни: **\n${queueList}`.slice(0, 4096))
        await button.reply({ embeds: [queueEmbed], ephemeral: true }
        )
      }
    }

    if (button.customId === 'download_song') {
      const song = distube.getQueue(queue.textChannel.guild).songs[0]

      await module.exports.downloadSong(song, button.message, button.user.username)
    }

    if (connection) {
      if (connection.joinConfig.channelId !== button.member.voice.channelId) {
        await button.message.channel.send({ content: `${button.user.username} попытался нажать на кнопки, но он не в голосовом чате со мной!` })
        return
      }
    } else {
      if (distube.getQueue(queue.textChannel.guild)) {
        await distube.stop(queue.textChannel.guild)
      }
    }

    /*
          if(button.member.permissions.has('MANAGE_GUILD') || button.member.user.id === message.author.id || message.guild.me.voice.channel.members.size < 2){
          }else{
              await button.reply({content: "У тебя нехватает прав на нажатие кнопок плеера", ephemeral: true})
              return
          }
    */
    if (button.customId === 'stop_music') {
      const vc = voice.getVoiceConnection(button.guild.id)
      if (vc) await voice.getVoiceConnection(button.guild.id).destroy()
      await button.message.channel.send({ content: `${button.user.username} выключил плеер` })
    }

    if (button.customId === 'pause_music') {
      await module.exports.pausePlayer(distube, button.message)
      await button.deferUpdate()
    }

    if (button.customId === 'toggle_repeat') {
      await module.exports.changeRepeatMode(distube, button.message)
      await button.deferUpdate()
    }

    if (button.customId === 'skip_song') {
      await module.exports.skipSong(distube, distube.getQueue(queue.textChannel.guild), button.message, button.user.username)
      await button.deferUpdate()
    }
  })
}

module.exports.updateEmbedWithSong = async (queue, song) => {
  const guild = queue.textChannel.guildId
  await module.exports.setPlayerEmbedState(guild, PLAYER_STATES.playing)
  module.exports.editField(guild, PLAYER_FIELDS.author, song.uploader.name)
  if (song.isLive) {
    module.exports.editField(guild, PLAYER_FIELDS.duration, ':red_circle:' + ' Прямая трансляция')
  } else {
    module.exports.editField(guild, PLAYER_FIELDS.duration, song.formattedDuration)
  }
  module.exports.editField(guild, PLAYER_FIELDS.queue_duration, queue.formattedDuration)
  module.exports.editField(guild, PLAYER_FIELDS.remaining_songs, (queue.songs.length - 1).toString())
  await musicPlayerMap[guild].PlayerEmbed.setThumbnail(song.thumbnail).setTitle(song.name).setURL(song.url)
}

const PLAYER_FIELDS = {
  author: 0,
  duration: 1,
  queue_duration: 2,
  remaining_songs: 3,
  repeat_mode: 4
}
module.exports.PLAYER_FIELDS = PLAYER_FIELDS

/**
 * Редактирует значения поля в плеере, но не отправляет изменения в сообщение в Discord
 *
 * @param guildID
 * @param field - PLAYERFIELDS.author || duration || queue_duration || remaining_songs || repeat_mode
 * @param value
 */
module.exports.editField = (guildID, field, value) => {
  musicPlayerMap[guildID].PlayerEmbed.fields[field].value = value || 'Неизвестно'
}

const PLAYER_STATES = {
  waiting: 0,
  playing: 1,
  paused: 2
}
module.exports.PLAYER_STATES = PLAYER_STATES

/**
 * Меняет состояние плеера (цвет, текст), но не отправляет изменения в сообщение в Discord
 *
 * @param guildID
 * @param state - waiting || playing || paused
 */
module.exports.setPlayerEmbedState = async (guildID, state) => {
  switch (state) {
    case PLAYER_STATES.waiting:
      await musicPlayerMap[guildID].PlayerEmbed.setTitle('').setURL('').setAuthor({ name: '💿 Ожидание 💿' }).setColor('#43f7f7').setThumbnail(null)
      module.exports.editField(guildID, PLAYER_FIELDS.author, undefined)
      module.exports.editField(guildID, PLAYER_FIELDS.duration, undefined)
      module.exports.editField(guildID, PLAYER_FIELDS.queue_duration, undefined)
      module.exports.editField(guildID, PLAYER_FIELDS.remaining_songs, undefined)
      break

    case PLAYER_STATES.playing:
      await musicPlayerMap[guildID].PlayerEmbed.setAuthor({ name: '🎵 Играет 🎵' }).setColor('#49f743')
      break

    case PLAYER_STATES.paused:
      await musicPlayerMap[guildID].PlayerEmbed.setAuthor({ name: '⏸️ Пауза ⏸️ ' }).setColor('#f74343')
      break
  }
}

/**
 * Применяем все изменения состояния плеера и полей к сообщению в Discord
 *
 * @param guildID
 * @param musicQueue
 * @returns {Promise<void>}
 */
module.exports.pushChangesToPlayerMessage = async (guildID, musicQueue) => {
  try {
    let message
    const channel = await musicQueue.textChannel.fetch(musicPlayerMap[guildID].ChannelID)
    if (channel) {
      message = await channel.messages.fetch(musicPlayerMap[guildID].MessageID)
    }
    if (message) {
      await message.edit({ embeds: [musicPlayerMap[guildID].PlayerEmbed] })
    }
  } catch (e) {

  }
}

module.exports.clearPlayerState = async (guild) => {
  if (musicPlayerMap[guild.id]) {
    await musicPlayerMap[guild.id].Collector.stop()
    const channel = guild.channels.cache.get(musicPlayerMap[guild.id].ChannelID)
    await channel.messages.fetch(musicPlayerMap[guild.id].MessageID).then((m) => {
      m.delete()
    })
    delete musicPlayerMap[guild.id]
  }
}

module.exports.stopPlayer = async (distube, guild) => {
  const vc = voice.getVoiceConnection(guild.id)
  if (vc) await voice.getVoiceConnection(guild.id).destroy()
  await module.exports.clearPlayerState(guild)
}

module.exports.pausePlayer = async (distube, message) => {
  const queue = distube.getQueue(message)
  if (queue.paused) {
    await distube.resume(message)
    await module.exports.setPlayerEmbedState(message.guild.id, PLAYER_STATES.playing)
  } else {
    await distube.pause(message)
    await module.exports.setPlayerEmbedState(message.guild.id, PLAYER_STATES.paused)
  }

  await message.edit({ embeds: [musicPlayerMap[message.guild.id].PlayerEmbed] })
}

module.exports.changeRepeatMode = async (distube, message) => {
  const queue = distube.getQueue(message)
  if (queue) {
    const repeat = queue.repeatMode
    let mode
    switch (repeat) {
      case 0:
        queue.setRepeatMode(1)
        mode = 'Песня'
        break
      case 1:
        queue.setRepeatMode(2)
        mode = 'Очередь'
        break
      case 2:
        queue.setRepeatMode(0)
        mode = 'Выключен'
        break
    }

    module.exports.editField(message.guild.id, PLAYER_FIELDS.repeat_mode, mode)
    await message.edit({ embeds: [musicPlayerMap[message.guild.id].PlayerEmbed] })
  }
}

module.exports.skipSong = async (distube, queue, message, username) => {
  if (queue.songs.length > 1) {
    await distube.skip(queue.textChannel.guild)
    await message.reply({ content: `По запросу от ${username} была пропущена песня` })
    if (queue.paused) {
      await distube.resume(queue.textChannel.guild)
    }
  } else {
    await message.reply({ content: 'В очереди дальше ничего нет', ephemeral: true })
  }
}

module.exports.downloadSong = async (song, message, username) => {
  if (song.isLive) {
    await message.channel.send({ content: `${username} это прямая трансляция, её нельзя скачать!` })
    return 0
  }

  const filePath = fs.createWriteStream(`${generateRandomCharacters(15)}.mp3`)

  const fileName = `${song.name}.mp3`

  ytdl(song.url, { filter: 'audioonly', format: 'mp3' }).on('end', async () => {
    await fs.rename(filePath.path, fileName, err => { if (err) throw err })
    const stats = fs.statSync(fileName)
    if (stats.size >= 8388608) {
      await message.channel.send({ content: `${username} я не могу отправить файл, так как он весит больше чем 8мб.` })
    } else {
      await message.channel.send({ content: `${username} я смог извлечь звук`, files: [fileName] })
    }

    fs.unlink(fileName, err => { if (err) throw err })
  }).pipe(filePath)
}

module.exports.CheckUserInVoice = async (client, message) => {
  if (!message.member.voice.channel) {
    await message.reply('Зайди сначала в любой голосовой канал')
    return true
  }

  const connection = getVoiceConnection(message.guild.id)
  if (connection) {
    if (connection.joinConfig.channelId !== message.member.voice.channel.id) {
      client.channels.fetch(connection.joinConfig.channelId)
        .then(channel => message.reply({ content: `Зайди на канал ${channel.name} ` }))
      return true
    }
  }

  return false
}
