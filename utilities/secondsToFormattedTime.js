function secondsToFormattedTime (duration) {
  const hrs = Math.floor(duration / 3600)
  const min = Math.floor((duration % 3600) / 60)
  const secs = Math.floor(duration % 60)

  let ret = ''

  if (hrs > 0) {
    ret += '' + hrs + ':' + (min < 10 ? '0' : '')
  }

  ret += '' + min + ':' + (secs < 10 ? '0' : '')
  ret += '' + secs
  return ret
}

module.exports = { secondsToFormattedTime }
