const config = require('config')
const DiscordOauth2 = require('discord-oauth2')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const { client } = require('../../../main')
const Redis = require('ioredis')
const RedisStore = require('connect-redis')(session)
const redisClient = new Redis()

const oauth = new DiscordOauth2({
  clientId: config.get('BOT_CLIENT_ID'),
  clientSecret: config.get('BOT_CLIENT_SECRET'),
  redirectUri: config.get('BOT_REDIRECT_URI') + '/auth'
})

const sessionMiddleware = session({
  key: 'userId',
  secret: 'superdupersecret',
  resave: false,
  saveUninitialized: false,
  store: new RedisStore({
    client: redisClient
  }),
  cookie: {
    expires: 60 * 60 * 24 * 1000 * 7// Секунды - Минуты - Часы - Милисекунды - Дни, итого одна неделя.
  }
})

function AuthRoutes (app) {
  app.use(cookieParser())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(sessionMiddleware)

  app.get('/auth', async (req, res) => {
    try {
      const { code } = req.query
      if (!code) {
        res.redirect('https://discord.com/api/oauth2/authorize?client_id=' + config.get('BOT_CLIENT_ID') + '&redirect_uri=' + encodeURI(config.get('BOT_REDIRECT_URI') + '/auth') + '&response_type=code&scope=identify')
        return
      }

      oauth.tokenRequest({
        code: code.toString(),
        scope: 'identify guilds',
        grantType: 'authorization_code'
      }).then(async (data) => {
        req.session.user = data
        await fetchBotWithUserGuilds(req.session.user.access_token).then((botGuildList) => {
          req.session.guilds = botGuildList
          res.redirect('http://localhost:3000/app')
        })
      })
    } catch (e) {

    }
  })

  app.get('/logout', async (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return console.log(err)
      }
      res.redirect('http://localhost:3000/')
    })
  })

  app.get('/getUser', async (req, res) => {
    if (req.session.user) {
      oauth.getUser(req.session.user.access_token).then((data) => {
        res.send({ userid: data.id, username: data.username, avatar: data.avatar })
      })
    } else {
      res.status(401).send({})
    }
  })

  app.get('/getUserGuilds', async (req, res) => {
    if (req.session.user) {
      await fetchBotWithUserGuilds(req.session.user.access_token).then((botGuildsList) => {
        req.session.guilds = botGuildsList
        res.send(botGuildsList)
      })
    } else {
      res.status(401).send({})
    }
  })
  app.get('/')

  async function fetchBotWithUserGuilds (token) {
    const botGuildsList = []
    const userGuildsList = await oauth.getUserGuilds(token)

    userGuildsList.forEach((element) => {
      const guild = client.guilds.cache.get(element.id)// Бот проверяет только те гильдии, в которых он присутствует.

      if (guild?.members.cache.find(user => user.id === client.user.id)) {
        botGuildsList.push(element)
      }
    })
    return botGuildsList
  }
}

const wrap = expressMiddlware => (socket, next) =>
  expressMiddlware(socket.request, {}, next)

module.exports = { AuthRoutes, wrap, sessionMiddleware }
