<p align="center">
    <img width="96" src="icons/logo.png" alt="BotLogo">
</p>
<h1 align="center">AICTest</h1>
<p align="center">
Cool audiobot for Discord created by <a href="https://vk.com/alexincube"><b>@AlexInCube</b></a></p>

## 🌟 Features
- Command /alcotest which shows your alcohol count in blood
- Audioplayer based on [Distube](https://github.com/skick1234/DisTube) with buttons ![image](https://i.imgur.com/zqQ6ViY.png)
- Support YouTube, Spotify, Soundcloud, any HTTP-stream and Discord Attachments (/playfile support MP3/WAV/OGG)
- Support Slash and Text commands (with customizable prefix per server using /setprefix)
- Localization (English and Russian are currently supported)

## 🎛️ Requirements
- Node.js 20 or higher
- MongoDB 6.0 or higher
- ffmpeg latest

## How to run bot?
### ⚙️ Configure .env
You can use Docker image or install things from "Requirements" and source code locally.
But in both cases, you need to configure .env file.

- Create .env.production
- Fill all fields in .env.production. If the field is marked as (Optional), you can skip it.
- (Required) To get Discord Token, follow this [guide](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot). After following the guide, you need to enable privileged intents in [Discord Developer Portal.](https://github.com/AlexInCube/AlCoTest/assets/25522245/fdbcdcf1-9501-47f0-93bf-7e76806f623f)
- (Optional) To get Spotify Secret and ID, follow this [guide](https://stevesie.com/docs/pages/spotify-client-id-secret-developer-api)
- (Optional) To get Yandex Music token, follow this [guide](https://github.com/MarshalX/yandex-music-api/discussions/513)

| Name                         | Example               | Description                                                             | Required? |
|------------------------------|-----------------------|-------------------------------------------------------------------------|-----------|
| `BOT_VERBOSE_LOGGING`        | false                 | The bot will give more information to the console, useful for debugging | ❌         |
| `BOT_COMMAND_PREFIX`         | //                    | Used only for text commands                                             | ✔️        |
| `BOT_LANGUAGE`               | en                    | Supported values: en ru                                                 | ❌         |
| `MONGO_URI`                  | mongodb://mongo:27017 | The public key for sending notifications                                | ✔️        |
| `MONGO_DATABASE_NAME`        | aicbot                | Database name in MongoDB                                                | ✔️        |
| `BOT_DISCORD_TOKEN`          | ODEzNzUwMTY1N...      | Token from Discord Developer Portal                                     | ✔️        |
| `BOT_DISCORD_CLIENT_ID`      | 813750165783...       | Client ID from Discord Developer Portal                                 | ✔️        |
| `BOT_DISCORD_OVERPOWERED_ID` | 29016845994426....    | This need to retrieve reports in direct message                         | ✔️        |
| `BOT_SPOTIFY_CLIENT_SECRET`  |                       | Used when the Spotify module cannot get the credentials automatically   | ❌         |
| `BOT_SPOTIFY_CLIENT_ID`      |                       | Used when the Spotify module get the credentials automatically          | ❌         |
| `BOT_YANDEXMUSIC_TOKEN`      |                       | Provide to enable Yandex Music module                                   | ❌         |
| `BOT_SOUNDCLOUD_CLIENT_ID`   |                       | Provide to fetch more data with SoundCloud Go+ account                  | ❌         |
| `BOT_SOUNDCLOUD_TOKEN`       |                       | Provide to fetch more data with SoundCloud Go+ account                  | ❌         |


### 🍪 Youtube Cookie
Also, it is preferable to provide cookies for YouTube.
This will allow you to play 18+ videos and bypass YouTube rate limiting error (429 Error).
I highly recommend that you create a new Google account from which you get the cookie.
You cannot watch videos in your browser from this account,
otherwise your cookie will be reset, and you will need to retrieve it again.

- Install an extension for extracting cookie, [EditThisCookie](https://www.editthiscookie.com/blog/2014/03/install-editthiscookie/)
- Go to [YouTube](https://www.youtube.com/)
- Log in to your account. (You should use a new account for this purpose)
- Click on the extension icon and click "Export" button.
- Create file yt-cookies.json and paste cookie in this file

### 🖥️ Run locally
- Install things from "Requirements" section
- Follow the "Configure .env" section and put .env.production in folder with repository.
- Follow the "YouTube Cookie" section and put yt-cookies.json in the folder with repository.
- Run commands below

```npm
npm install
npm run build
npm run production
```

### 🐋 Run in Docker
- Copy docker-compose.yml, Dockerfile in empty folder
- Follow the "Configure .env" section and put .env.production in folder with Dockerfile etc.
- Follow the "YouTube Cookie" section and put yt-cookies.json in the folder with Dockerfile etc.
- Run command ```docker-compose up --detach --force-recreate``` in folder with files
