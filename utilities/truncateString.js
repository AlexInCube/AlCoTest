function truncateString (str, n) {
  if (str.length > n - 3) {
    return str.slice(0, n - 3) + '...'
  } else {
    return str
  }
}

module.exports = { truncateString }
