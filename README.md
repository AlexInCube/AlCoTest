<p align="center">
    <img width="96" src="src/logo.png" alt="BotLogo">
</p>
<h1 align="center">AICTest</h1>
<p align="center">
Cool audiobot for Discord created by <a href="https://vk.com/alexincube"><b>@AlexInCube</b></a></p>

## 🌟 Features
- Command /alcotest which show your alcohol count in blood
- Audioplayer based on [Distube](https://github.com/skick1234/DisTube) with buttons ![image](https://i.imgur.com/zqQ6ViY.png)
- Support YouTube, Spotify, Soundcloud and Discord Attachments (/playfile support MP3/WAV/OGG)
- Support Slash and Text commands (with customizable prefix per server using /setprefix)
- Localization (English and Russian are currently supported)

## 🎛️ Requirements
- Node.js 18 or higher
- MongoDB 6.0 or higher
- ffmpeg latest

## How to run bot?
### ⚙️ Configure .env
You can use Docker image or install things from "Requirements" and source code locally.
But in both cases, you need to configure .env file.

- Create .env.production
- Fill all fields in .env.production
- (Required) To get Discord Token, follow this [guide](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot)
- (Optional) To get YouTube Cookie, follow this [guide](https://www.youtube.com/watch?v=iQnpef9LgVM)
- (Optional) To get Spotify Secret and ID, follow this [guide](https://stevesie.com/docs/pages/spotify-client-id-secret-developer-api)
- (Optional) To get Yandex Music token, follow this [guide](https://github.com/MarshalX/yandex-music-api/discussions/513)
```
BOT_COMMAND_PREFIX=<default prefix you want> Used only for text commands, for example: //
BOT_LANGUAGE=<language> Supported values: en ru

MONGO_URI=<ip to mongodb> If you run bot locally, use mongodb://localhost:27017. If you run in Docker, use mongodb://mongo:27017
MONGO_DATABASE_NAME=<any name you want> Database name in MongoDB, for example: aicbot

BOT_DISCORD_TOKEN=<discord token>
BOT_DISCORD_CLIENT_ID=<discord bot id>
BOT_DISCORD_OVERPOWERED_ID=<your id in discord> This need to retrieve reports in direct message

BOT_YOUTUBE_COOKIE=<cookie> (Optional)

BOT_SPOTIFY_CLIENT_SECRET=<spotify secret> (Optional)
BOT_SPOTIFY_CLIENT_ID=<spotify id> (Optional)

BOT_YANDEXMUSIC_TOKEN=<yandexmusic token> (Optional)
```

### 🖥️ Run locally
- Install things from "Requirements" section
- Follow "Configure .env" section and put .env.production in folder with repository.
- Run commands below

```npm
npm install
npm run build
npm run production
```

### 🐋 Run in Docker
- Copy docker-compose.yml, Dockerfile, runInDocker.bat (for Windows) or runInDocker.sh (for Linux) in empty folder
- Follow "Configure .env" section and put .env.production in folder with Dockerfile etc.
- Run "runInDocker" file
