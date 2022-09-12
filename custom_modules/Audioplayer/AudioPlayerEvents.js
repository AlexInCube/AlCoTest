const AudioPlayerEvents = {
  /**
   * Это событие прекращает воспроизведение плеера.
   * Принимает: guild
   */
  requestStopPlayer: 'requestStopPlayer',
  /**
   * Это событие нельзя вызывать самостоятельно, его вызывает только событие requestStopPlayer и функция createPlayer.
   * Это событие очищает память от плеера.
   * Принимает: guild
   */
  _destroyPlayer: 'destroyPlayer',

  /**
   * Это событие запрашивает пропуск песни.
   * Принимает: guild, username
   */
  requestSongSkip: 'requestSongSkip',
  /**
   * Это событие ответ на requestSongSkip
   * Возвращает: guild, song, username
   */
  responseSongSkip: 'responseSongSkip',

  /**
   * Это событие запрашивает переключение паузы и проигрывание плеера.
   * Принимает: guild
   */
  requestTogglePauseAndResume: 'requestTogglePauseAndResume',

  /**
   * Это событие запрашивает установку паузы. Вызов события requestTogglePauseAndResume, так же может вызвать requestPlayerPause.
   * Принимает: guild
   */
  requestPlayerPause: 'requestPlayerPause',
  /**
   * Это событие ответ на requestPlayerPause
   * Возвращает: guild
   */
  responsePlayerPause: 'requestPlayerPause',

  /**
   * Это событие запрашивает снятие паузы. Вызов события requestTogglePauseAndResume, так же может вызвать requestPlayerResume.
   * Принимает: guild
   */
  requestPlayerResume: 'requestPlayerResume',
  /**
   * Это событие ответ на requestPlayerResume
   * Возвращает: guild
   */
  responsePlayerResume: 'responsePlayerResume',

  /**
   * Это событие запрашивает переключения режима повтора.
   * Принимает: guild
   */
  requestToggleRepeatMode: 'requestToggleRepeatMode',
  /**
   * Это событие ответ на requestToggleRepeatMode
   * Возвращает: guild, repeatMode
   */
  responseToggleRepeatMode: 'responseToggleRepeatMode',

  /**
   * Это событие запрашивает прыжок на определённую песню в очереди.
   * Принимает: guild, queuePosition, username
   */
  requestQueueJump: 'requestQueueJump',
  /**
   * Это событие ответ на responseQueueJump
   * Возвращает: guild, queuePosition, username
   */
  responseQueueJump: 'responseQueueJump',

  /**
   * Это событие запрашивает удаление определённой песни из очереди.
   * Принимает: guild, queuePosition, username
   */
  requestDeleteSong: 'requestDeleteSong',
  /**
   * Это событие ответ на requestDeleteSong
   * Возвращает: guild, queuePosition, username
   */
  responseDeleteSong: 'responseDeleteSong',

  /**
   * Это событие запрашивает перемешивание песен в очереди.
   * Принимает: guild, username
   */
  requestQueueShuffle: 'requestQueueShuffle',
  /**
   * Это событие ответ на requestQueueShuffle
   * Возвращает: guild, username
   */
  responseQueueShuffle: 'responseQueueShuffle',

  /**
   * Это событие запрашивает смену места откуда проигрывается песня.
   * Принимает: guild, time, username
   */
  requestChangeSongTime: 'requestChangeSongTime',
  /**
   * Это событие ответ на requestChangeSongTime
   * Возвращает: guild, time, username
   */
  responseChangeSongTime: 'responseChangeSongTime'
}

module.exports = { AudioPlayerEvents }
