---
sidebar_position: 1
sidebar_label: Configure .env
---

# ⚙️ Configure .env

You can use Docker Compose or install all dependencies and source code locally.
But in both cases, you need to configure .env a file.

Also you need retrieve token, client id and enable intents on Discord Developer Portal.

- Create file .env.production (if you developer create .env.development)
- Fill all fields in .env.production If the field is marked as (Optional), you can skip it (don't include field in .env.production and don't set field to "undefined").
- (Required) To get Discord Token and enable intents, follow the [Discord Developer Portal](./api-configure.md#discord-developer-portal) section.
- (Optional) To get YouTube cookies and bypass different errors with YouTube, follow the [YouTube](./api-configure.md#youtube-cookie) section
- (Optional) To get Spotify Secret and ID, follow the [Spotify](./api-configure.md#spotify) section.
- (Optional) To get Yandex Music token, follow the [Yandex Music](./api-configure.md#yandex-music) section.
- (Optional) To get SoundCloud token, follow the [Soundcloud](./api-configure.md#soundcloud) section.
- (Optional) To get Genius token, follow the [Genius](./api-configure.md#genius) section.
- (Optional) To get VKontakte token, follow the [VKontakte](./api-configure.md#vkontakte) section.

The bot reads `.env.production` when started with `production` and `.env.development` when started with `development`. If the file is missing, it reads the same names from the OS environment variables. Optional fields use the example value as the default.

| Name                         | Example                                                                  | Description                                                                                                                                 | Required |
|------------------------------|--------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------|----------|
| `BOT_VERBOSE_LOGGING`        | false                                                                    | The bot will give more info to the console, useful for debugging                                                                            | ❌        |
| `BOT_FFMPEG_LOGGING`         | false                                                                    | The bot will give info about FFMPEG to the console, useful for debugging                                                                    | ❌        |
| `BOT_COMMAND_PREFIX`         | //                                                                       | Used only for text commands                                                                                                                 | ✔️       |
| `BOT_MAX_SONGS_IN_QUEUE`     | 500                                                                      | Define max songs count per queue                                                                                                            | ❌        |
| `BOT_MAX_SONGS_HISTORY_SIZE` | 60                                                                       | Define max songs history per guild, set to 0 if you want to disable history (this will not delete history in database which already exists) | ❌        |
| `BOT_MAX_PLAYLISTS_PER_USER` | 25                                                                       | Define max playlists one user can create, from 1 to 50                                                                                      | ❌        |
| `BOT_MAX_SONGS_IN_USER_PLAYLIST` | 500                                                                  | Define max songs count in one user playlist                                                                                                 | ❌        |
| `BOT_LANGUAGE`               | en                                                                       | Supported values: en ru                                                                                                                     | ❌        |
| `MONGO_URI`                  | Docker: mongodb://aicbot-mongo:27017 or Local: mongodb://localhost:27017 | IP address of MongoDB                                                                                                                       | ✔️       |
| `MONGO_DATABASE_NAME`        | aicbot                                                                   | Database name in MongoDB                                                                                                                    | ✔️       |
| `BOT_DISCORD_TOKEN`          | ODEzNzUwMTY1N...                                                         | Token from Discord Developer Portal                                                                                                         | ✔️       |
| `BOT_DISCORD_CLIENT_ID`      | 813750165783...                                                          | Application ID from Discord Developer Portal                                                                                                | ✔️       |
| `BOT_DISCORD_OVERPOWERED_ID` | 29016845994426....                                                       | Discord bot owner user ID, required for having more bot control for owner                                                                   | ✔️       |
| `BOT_SPOTIFY_CLIENT_SECRET`  |                                                                          | Used when the Spotify module cannot get the credentials automatically                                                                       | ❌        |
| `BOT_SPOTIFY_CLIENT_ID`      |                                                                          | Used when the Spotify module cannot get the credentials automatically                                                                       | ❌        |
| `BOT_YANDEXMUSIC_TOKEN`      |                                                                          | Provide to enable Yandex Music module                                                                                                       | ❌        |
| `BOT_YANDEXMUSIC_UID`        |                                                                          | Provide to enable Yandex Music module                                                                                                       | ❌        |
| `BOT_VKONTAKTE_TOKEN`        |                                                                          | Provide to fetch songs from VKontakte                                                                                                       | ❌        |
| `BOT_SOUNDCLOUD_CLIENT_ID`   |                                                                          | Provide to fetch more data with SoundCloud Go+ account                                                                                      | ❌        |
| `BOT_SOUNDCLOUD_TOKEN`       |                                                                          | Provide to fetch more data with SoundCloud Go+ account                                                                                      | ❌        |
| `BOT_GENIUS_TOKEN`           |                                                                          | Provide to fetch songs lyrics from Genius                                                                                                   | ❌        |
