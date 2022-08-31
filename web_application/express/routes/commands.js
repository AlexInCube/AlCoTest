const express = require('express')
const { client } = require('../../../main')

module.exports = function (app) {
  const commandsRouter = express.Router()

  commandsRouter.use('/list', async function (request, response) {
    const commandsList = { groups: ['all'], commands: [] }

    client.commands_groups.forEach((value, key) => {
      commandsList.groups.push(key)
    })

    client.commands.forEach((value) => {
      const command = Object.assign({}, value.help)
      delete command.bot_permissions
      commandsList.commands.push(command)
    })
    response.send(commandsList)
  })

  app.use('/commands', commandsRouter)
}
