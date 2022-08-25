const PLAYER_STATES = {
  waiting: 0,
  playing: 1,
  paused: 2
}

const PLAYER_FIELDS = {
  author: 0,
  duration: 1,
  queue_duration: 2,
  remaining_songs: 3,
  repeat_mode: 4,
  requester: 5
}

module.exports = { PLAYER_FIELDS, PLAYER_STATES }
