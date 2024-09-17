# ⚙️ Configure .env

You can use Docker Compose or install all dependencies and source code locally.
But in both cases, you need to configure .env file.

Also you need retrieve token, client id and enable intents on Discord Developer Portal.

- Create file .env.production (if you developer create .env.development)
- Fill all fields in .env.\* If the field is marked as (Optional), you can skip it.
- (Required) To get Discord Token and enable intents, follow the [Discord Developer Portal](https://github.com/AlexInCube/AlCoTest/wiki/API-Configure#discord-developer-portal-required) section.
- (Optional) To get YouTube cookies and bypass different errors with YouTube, follow the [YouTube](https://github.com/AlexInCube/AlCoTest/wiki/API-Configure#-youtube-cookie-optional) section
- (Optional) To get Spotify Secret and ID, follow the [Spotify](https://github.com/AlexInCube/AlCoTest/wiki/API-Configure#spotify-optional) section.
- (Optional) To get Yandex Music token, follow the [Yandex Music](https://github.com/AlexInCube/AlCoTest/wiki/API-Configure#yandex-music-optional) section.
- (Optional) To get SoundCloud token, follow the [Soundcloud](https://github.com/AlexInCube/AlCoTest/wiki/API-Configure#soundcloud-optional) section.
- (Optional) To get Genius token, follow the [Genius](https://github.com/AlexInCube/AlCoTest/wiki/API-Configure#genius-optional) section.
- (Optional) To get VKontakte token, follow the [VKontakte](https://github.com/AlexInCube/AlCoTest/wiki/API-Configure#vkontakte-optional) section.

| Name                         | Example               | Description                                                                                                                                 | Required |
|------------------------------|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------------|----------|
| `BOT_VERBOSE_LOGGING`        | false                 | The bot will give more info to the console, useful for debugging                                                                            | ❌        |
| `BOT_FFMPEG_LOGGING`         | false                 | The bot will give info about FFMPEGto the console, useful for debugging                                                                     | ❌        |
| `BOT_COMMAND_PREFIX`         | //                    | Used only for text commands                                                                                                                 | ✔️       |
| `BOT_MAX_SONGS_IN_QUEUE`     | 500                   | Define max songs count per queue                                                                                                            | ❌        |
| `BOT_MAX_SONGS_HISTORY_SIZE` | 60                    | Define max songs history per guild, set to 0 if you want to disable history (this will not delete history in database which already exists) | ❌        |
| `BOT_LANGUAGE`               | en                    | Supported values: en ru                                                                                                                     | ❌        |
| `MONGO_URI`                  | mongodb://mongo:27017 | The public key for sending notifications                                                                                                    | ✔️       |
| `MONGO_DATABASE_NAME`        | aicbot                | Database name in MongoDB                                                                                                                    | ✔️       |
| `BOT_DISCORD_TOKEN`          | ODEzNzUwMTY1N...      | Token from Discord Developer Portal                                                                                                         | ✔️       |
| `BOT_DISCORD_CLIENT_ID`      | 813750165783...       | Application ID from Discord Developer Portal                                                                                                | ✔️       |
| `BOT_DISCORD_OVERPOWERED_ID` | 29016845994426....    | Discord bot owner user ID, required for having more bot control for owner                                                                   | ✔️       |
| `BOT_GOOGLE_EMAIL`           |                       | Used to automate cookies fetching for YouTube                                                                                               | ❌        |
| `BOT_GOOGLE_PASSWORD`        |                       | Used to automate cookies fetching for YouTube                                                                                               | ❌        |
| `BOT_SPOTIFY_CLIENT_SECRET`  |                       | Used when the Spotify module cannot get the credentials automatically                                                                       | ❌        |
| `BOT_SPOTIFY_CLIENT_ID`      |                       | Used when the Spotify module get the credentials automatically                                                                              | ❌        |
| `BOT_YANDEXMUSIC_TOKEN`      |                       | Provide to enable Yandex Music module                                                                                                       | ❌        |
| `BOT_YANDEXMUSIC_UID`        |                       | Provide to enable Yandex Music module                                                                                                       | ❌        |
| `BOT_VKONTAKTE_TOKEN`        |                       | Provide to fetch songs from VKontakte                                                                                                       | ❌        |
| `BOT_SOUNDCLOUD_CLIENT_ID`   |                       | Provide to fetch more data with SoundCloud Go+ account                                                                                      | ❌        |
| `BOT_SOUNDCLOUD_TOKEN`       |                       | Provide to fetch more data with SoundCloud Go+ account                                                                                      | ❌        |
| `BOT_GENIUS_TOKEN`           |                       | Provide to fetch songs lyrics from Genius                                                                                                   | ❌        |

# 🐋 Run in Docker (recommended)

- Install [Docker](https://www.docker.com/get-started/)
- Copy docker-compose.yml, Dockerfile in empty folder
- Follow the [Configure .env](#-configure-env) section and copy .env.production in folder with docker-compose.yml etc.
- (Optional) Follow the [YouTube Cookie](https://github.com/AlexInCube/AlCoTest/wiki/API-Configure#-youtube-cookie-optional) section and copy yt-cookies.json in the folder with docker-compose.yml etc.
- Your file structure must be like this

```
AICoTest/
  ├─ .env.production
  ├─ docker-compose.yml
  ├─ yt-cookies.json
```

- Run command `docker-compose up --detach --force-recreate` from folder with files

> [!NOTE]
> If you use terminal, Linux or Git Bash etc...,
> you can copy runInDocker.sh or updateAndRunInDocker.sh to folder with other files.
> And run command `sh updateAndRunInDocker.sh` to update bot image and restart containers.

# 🖥️ Run locally (if you are not a developer, this way is no sense)

- Install [Node.js 22](https://nodejs.org/en/download/prebuilt-installer) or higher
- Install [Python 3.12](https://www.python.org/downloads/)
- Install C++ compiler. Follow this [guide](https://github.com/nodejs/node-gyp#on-windows)
- Install FFMpeg. Follow this [guide](https://www.wikihow.com/Install-FFmpeg-on-Windows)
- Clone repository to your computer
- Follow the [Configure .env](#-configure-env) section and copy .env.development in folder with repository.
- (Optional) Follow the [YouTube Cookie](https://github.com/AlexInCube/AlCoTest/wiki/API-Configure#-youtube-cookie-optional) and copy yt-cookies.json in the folder with repository.
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

or if you are a developer

```
npm run development
```
