const overpoweredIDs = JSON.parse(process.env.BOT_DISCORD_OVERPOWERED_IDS)
function isOverpowered (id) {
  return overpoweredIDs.some((op) => op === id)
}

module.exports = { isOverpowered }
