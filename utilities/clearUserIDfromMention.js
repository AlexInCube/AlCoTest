module.exports = function ClearUsedIDFromMention (mention) {
  if (!mention) return

  if (mention.startsWith('<@&') && mention.endsWith('>')) {
    mention = mention.slice(3, -1)

    if (mention.startsWith('!')) {
      mention = mention.slice(1)
    }

    return mention
  }
}
