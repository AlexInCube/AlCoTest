<p align="center">
    <img width="96" src="src/logo.png" alt="BotLogo">
</p>
<h1 align="center">AICTest</h1>
<p align="center">
Cool audiobot for Discord created by <a href="https://vk.com/alexincube"><b>@AlexInCube</b></a></p>

## Features

- Based on [Distube](https://github.com/skick1234/DisTube)
- Rich audioplayer with buttons
- Support YouTube, Spotify, Soundcloud
- Support slash and text commands
- Localization

## Requirements
- Node.js 16.9.0 or higher
- MongoDB 6.0 or higher

# How to run bot?
You can use Docker image or install Node.js, MongoDB and source code locally.
But in both cases you need to configure .env file.

- Copy .env in repository and rename it to .env.production
- Fill all fields in .env.production
- To get Discord Token, follow this [guide](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot)
- To get Youtube Cookie, follow this [guide](https://www.youtube.com/watch?v=iQnpef9LgVM)
- To get Spotify Secret and ID, follow this [guide](https://stevesie.com/docs/pages/spotify-client-id-secret-developer-api)

```
BOT_COMMAND_PREFIX=<default prefix you want> Used only for text commands
BOT_LANGUAGE=<language> Supported values: en ru

BOT_DISCORD_TOKEN=<discord token>
BOT_DISCORD_CLIENT_ID=<discord bot id>
BOT_DISCORD_OVERPOWERED_ID=<your id in discord> You are retrieve reports in direct message

BOT_YOUTUBE_COOKIE=<cookie> 
BOT_SPOTIFY_CLIENT_SECRET=<spotify secret>
BOT_SPOTIFY_CLIENT_ID=<spotify id>

MONGO_URI=<ip to mongodb> If you run bot locally, use mongodb://localhost:27017. If you run in Docker, use mongodb://mongo:27017
MONGO_DATABASE_NAME=<any name you want> Database name in MongoDB, for example: aicbot
```

### Run locally
```npm
npm install
npm run build
npm run production
```
### Run in Docker
- Copy docker-compose.yml, Dockerfile, runInDocker.bat (for Windows) or runInDocker.sh (for Linux) in empty folder
- Copy .env file in this folder and follow steps above
- Run .bat or .sh
