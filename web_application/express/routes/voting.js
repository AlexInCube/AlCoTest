const { client } = require('../../../main')
require('express')
const bodyParser = require('body-parser')
const { MessageEmbed } = require('discord.js')

function VotingRoutes (app) {
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(bodyParser.json())

  app.post('/voting/sendForm', async function (request, response) {
    try {
      const guild = client.guilds.cache.get(request.body.guildId)
      if (!guild) { response.status(403).send(undefined); return }

      const form = request.body.form

      const channel = guild.channels.cache.get(form.textChannelId)
      if (!channel) return

      let voteVariants = ''
      form.variantsList.forEach((variant, index) => {
        voteVariants += `${index + 1}. ${variant.emoji} - ${variant.name}\n`
      })

      const voteEmbed = new MessageEmbed()
        .setColor('#EBFF11')
        .setTitle(form.voteName)
        .setDescription(voteVariants)
        .setAuthor({
          name: `${request.session.user.detail.username}`,
          iconURL: `https://cdn.discordapp.com/avatars/${request.session.user.detail.id}/${request.session.user.detail.avatar}`
        })
      const message = await channel.send({ embeds: [voteEmbed] })
      for (const variant of form.variantsList) {
        await message.react(variant.emoji)
      }

      response.status(200)
    } catch (e) {
      response.status(400)
    }
  })

  app.get('/voting/textChannels', async function (request, response) {
    if (!request.session) { response.status(403); return }

    request.session.reload(() => {
      if (!request.session.user) {
        response.status(403)
        return
      }
      const guild = client.guilds.cache.get(request.query.guildId)
      if (!guild) {
        response.status(403)
        return
      }
      const channels = []
      guild.members.fetch(request.session.user.detail.id).then((member) => {
        if (!member) {
          response.status(403)
          return
        }
        guild.channels.cache.forEach((channel) => {
          if (channel.isText()) {
            if (channel.permissionsFor(guild.me).has('SEND_MESSAGES', false)) {
              if (channel.permissionsFor(member).has('SEND_MESSAGES', false)) {
                channels.push({ name: channel.name, id: channel.id })
              }
            }
          }
        })
        response.status(200).send(channels)
      })
    })
  })
}

module.exports = { VotingRoutes }
