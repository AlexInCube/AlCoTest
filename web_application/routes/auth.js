const config = require('config')
const axios = require('axios')
const url = require('url')

module.exports = function (app) {
  app.get('/auth', async (req, res) => {
    const { code } = req.query
    if (code) {
      try {
        const formData = new url.URLSearchParams({
          client_id: config.get('BOT_CLIENT_ID'),
          client_secret: config.get('BOT_CLIENT_SECRET'),
          grant_type: 'authorization_code',
          code: code.toString(),
          redirect_uri: config.get('BOT_REDIRECT_URI') + '/auth'
        })
        const response = await axios.post('https://discord.com/api/oauth2/token',
          formData.toString(), {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          })
        // eslint-disable-next-line camelcase
        const { access_token } = response.data
        const { data: userResponse } = await axios.get(
          'https://discord.com/api/users/@me/guilds',
          {
            headers: {
              // eslint-disable-next-line camelcase
              Authorization: `Bearer ${access_token}`
            }
          }
        )
        res.send(userResponse)
      } catch (err) {
        console.log(err)
        res.sendStatus(400)
      }
    } else {
      res.redirect('https://discord.com/api/oauth2/authorize?client_id=931157065005690930&redirect_uri=26.221.216.202%3A8000%2Fauth&response_type=code&scope=identify%20guilds')
    }
  })

  app.get('/')
}
