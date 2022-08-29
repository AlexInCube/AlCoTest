function getCurrentTimestamp () {
  let today = new Date()
  const dd = String(today.getDate()).padStart(2, '0')
  const mm = String(today.getMonth() + 1).padStart(2, '0') // January is 0!
  const yyyy = String(today.getFullYear()).padStart(2, '0')
  const hour = String(today.getHours()).padStart(2, '0')
  const minute = String(today.getMinutes()).padStart(2, '0')
  const seconds = String(today.getSeconds()).padStart(2, '0')

  today = dd + '/' + mm + '/' + yyyy + ' | ' + hour + ':' + minute + ':' + seconds
  return `[ ${today.toString()} ] `
}

function loggerSend (message) {
  console.log(getCurrentTimestamp() + message)
}

module.exports = { getCurrentTimestamp, loggerSend }