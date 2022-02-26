const fetch = require('node-fetch')
const config = require('config')
const PORT = config.get('PORT')

module.exports = function (app) {
  app.get('/get_audio_status', (req, res) => {
    res.send({
      status: 'Playing',
      timeline: '0:50'
    })
  })

  app.get('/auth', async ({ query }, response) => {
    const { code } = query

    if (code) {
      try {
        const oauthResult = await fetch('https://discord.com/api/oauth2/token', {
          method: 'POST',
          body: new URLSearchParams({
            client_id: config.get('BOT_CLIENT_ID'),
            client_secret: config.get('BOT_CLIENT_SECRET'),
            code,
            grant_type: 'authorization_code',
            redirect_uri: 'http://localhost:8000/auth',
            scope: 'identify'
          }),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json'
          }
        })

        const oauthData = await oauthResult.json()
        console.log(oauthData)
        return response.redirect('http://localhost:3000')
      } catch (error) {
        console.error(error)
      }
    }

    return response.redirect('https://discord.com/api/oauth2/authorize?client_id=931157065005690930&redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fauth&response_type=code&scope=identify')
  })
}
