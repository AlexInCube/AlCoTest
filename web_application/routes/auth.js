const config = require('config')
const DiscordOauth2 = require('discord-oauth2')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')

const oauth = new DiscordOauth2({
  clientId: config.get('BOT_CLIENT_ID'),
  clientSecret: config.get('BOT_CLIENT_SECRET'),
  redirectUri: config.get('BOT_REDIRECT_URI') + '/auth'
})

module.exports = function (app) {
  app.use(cookieParser())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(session({
    key: 'userId',
    secret: 'superdupersecret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: 60 * 60 * 24
    }
  }))

  app.get('/auth', async (req, res) => {
    const { code } = req.query
    if (!code) {
      res.redirect('https://discord.com/api/oauth2/authorize?client_id=' + config.get('BOT_CLIENT_ID') + '&redirect_uri=' + encodeURI(config.get('BOT_REDIRECT_URI') + '/auth') + '&response_type=code&scope=identify')
      return
    }

    oauth.tokenRequest({
      code: code.toString(),
      scope: 'identify guilds',
      grantType: 'authorization_code'
    }).then((data) => {
      req.session.user = data
      console.log('Token session')
      console.log(req.session)
      res.redirect('http://localhost:3000/')
    })
  })

  app.get('/logout', async (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return console.log(err)
      }
      res.redirect('/')
    })
  })

  app.get('/getUser', async (req, res) => {
    if (req.session) {
      console.log('GetUser session')
      console.log(req.session)
      oauth.getUser(req.session.user.access_token).then((data) => {
        res.send({ userid: data.id, username: data.username, avatar: data.avatar })
      })
    } else {
      res.status(402).send({})
    }
  })

  app.get('/')
}
