# How to setup bot?
## ⚙️ Configure .env
You can use Docker Compose or install all dependencies and source code locally.
But in both cases, you need to configure .env file. 

Also you need retrieve token, client id and enable intents on Discord Developer Portal.

- Create file .env.production
- Fill all fields in .env.production. If the field is marked as (Optional), you can skip it.
- (Required) To get Discord Token and enable intents, follow the [Discord Developer Portal](API-Configure.md#discord-developer-portal-required) section. 
- (Optional) To get Spotify Secret and ID, follow the [Spotify](API-Configure.md#spotify-optional) section.
- (Optional) To get Yandex Music token, follow the [Yandex Music](API-Configure.md#yandex-music-optional) section.
- (Optional) To get SoundCloud token, follow the [Soundcloud](API-Configure.md#soundcloud-optional) section.

| Name                         | Example               | Description                                                             | Required? |
|------------------------------|-----------------------|-------------------------------------------------------------------------|-----------|
| `BOT_VERBOSE_LOGGING`        | false                 | The bot will give more information to the console, useful for debugging | ❌         |
| `BOT_COMMAND_PREFIX`         | //                    | Used only for text commands                                             | ✔️        |
| `BOT_LANGUAGE`               | en                    | Supported values: en ru                                                 | ❌         |
| `MONGO_URI`                  | mongodb://mongo:27017 | The public key for sending notifications                                | ✔️        |
| `MONGO_DATABASE_NAME`        | aicbot                | Database name in MongoDB                                                | ✔️        |
| `BOT_DISCORD_TOKEN`          | ODEzNzUwMTY1N...      | Token from Discord Developer Portal                                     | ✔️        |
| `BOT_DISCORD_CLIENT_ID`      | 813750165783...       | Application ID from Discord Developer Portal                            | ✔️        |
| `BOT_DISCORD_OVERPOWERED_ID` | 29016845994426....    | This need to retrieve reports in direct message                         | ✔️        |
| `BOT_SPOTIFY_CLIENT_SECRET`  |                       | Used when the Spotify module cannot get the credentials automatically   | ❌         |
| `BOT_SPOTIFY_CLIENT_ID`      |                       | Used when the Spotify module get the credentials automatically          | ❌         |
| `BOT_YANDEXMUSIC_TOKEN`      |                       | Provide to enable Yandex Music module                                   | ❌         |
| `BOT_YANDEXMUSIC_UID`        |                       | Provide to enable Yandex Music module                                   | ❌         |
| `BOT_SOUNDCLOUD_CLIENT_ID`   |                       | Provide to fetch more data with SoundCloud Go+ account                  | ❌         |
| `BOT_SOUNDCLOUD_TOKEN`       |                       | Provide to fetch more data with SoundCloud Go+ account                  | ❌         |

## 🐋 Run in Docker (recommended)
[!Note]
Using Docker provides the auto-update feature

- Install [Docker](https://www.docker.com/get-started/)
- Copy docker-compose.yml, Dockerfile in empty folder
- Follow the [Configure .env](#-configure-env) section and copy .env.production in folder with docker-compose.yml etc.
- (Optional) Follow the [YouTube Cookie](API-Configure.md#-youtube-cookie-optional) section and copy yt-cookies.json in the folder with docker-compose.yml etc.
- Your file structure must be like this
```
AICoTest/
  ├─ .env.production
  ├─ docker-compose.yml
  ├─ yt-cookies.yml
```
- Run command ```docker-compose up --detach --force-recreate``` from folder with files

## 🖥️ Run locally (if you are not a developer, this way is no sense)
- Install [Node.js 22](https://nodejs.org/en/download/prebuilt-installer) or higher
- Install [Python 3.12](https://www.python.org/downloads/)
- Install C++ compiler. Follow this [guide](https://github.com/nodejs/node-gyp#on-windows)
- Install FFMpeg. Follow this [guide](https://www.wikihow.com/Install-FFmpeg-on-Windows)
- Clone repository to your computer
- Follow the [Configure .env](#-configure-env) section and copy .env.production in folder with repository.
- (Optional) Follow the [YouTube Cookie](API-Configure.md#-youtube-cookie-optional) and copy yt-cookies.json in the folder with repository.
- Install Node.js packages in the folder with repository
```npm
npm install
```
- Compile bot
```
npm run build
```
- Run the bot
```
npm run production
```

