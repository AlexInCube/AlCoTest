const DiscordOauth2 = require('discord-oauth2')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const { client } = require('../../../main')
const Redis = require('ioredis')
const { loggerSend } = require('../../../utilities/logger')
const RedisStore = require('connect-redis')(session)
const redisClient = new Redis()
redisClient.on('error', (err) => loggerSend('Ошибка при подключении к Redis', err))
redisClient.on('connect', () => loggerSend('Подключение к Redis успешно установлено'))

const oauth = new DiscordOauth2({
  clientId: process.env.BOT_DISCORD_CLIENT_ID,
  clientSecret: process.env.BOT_DISCORD_CLIENT_SECRET,
  redirectUri: process.env.BOT_REST_API_URL + '/auth'
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
        const authUrl = ('https://discord.com/api/oauth2/authorize?client_id=' + process.env.BOT_DISCORD_CLIENT_ID + '&redirect_uri=' + encodeURI(process.env.BOT_REST_API_URL + '/auth') + '&response_type=code&scope=identify%20guilds')
        res.redirect(authUrl)
        return
      }

      oauth.tokenRequest({
        code: code.toString(),
        scope: 'identify guilds',
        grantType: 'authorization_code'
      }).then(async (data) => {
        req.session.user = data
        fetchUserdata(req.session.user.access_token).then((userData) => {
          req.session.user.detail = userData
          res.redirect(`${process.env.BOT_DASHBOARD_URL}/app`)
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
      res.redirect(`${process.env.BOT_DASHBOARD_URL}/`)
    })
  })

  app.get('/getUser', async (req, res) => {
    if (req.session.user) {
      fetchUserdata(req.session.user.access_token).then((userData) => {
        req.session.user.detail = userData
        res.send(userData)
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

  async function fetchUserdata (token) {
    return await oauth.getUser(token)
  }
}

const wrap = expressMiddlware => (socket, next) =>
  expressMiddlware(socket.request, {}, next)

module.exports = { AuthRoutes, wrap, sessionMiddleware }
