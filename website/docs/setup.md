---
sidebar_position: 2
---

# Setup

## ⚙️ Configure .env {#configure-env}

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

| Name                         | Example                                                                  | Description                                                                                                                                 | Required |
|------------------------------|--------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------|----------|
| `BOT_VERBOSE_LOGGING`        | false                                                                    | The bot will give more info to the console, useful for debugging                                                                            | ❌        |
| `BOT_FFMPEG_LOGGING`         | false                                                                    | The bot will give info about FFMPEG to the console, useful for debugging                                                                    | ❌        |
| `BOT_COMMAND_PREFIX`         | //                                                                       | Used only for text commands                                                                                                                 | ✔️       |
| `BOT_MAX_SONGS_IN_QUEUE`     | 500                                                                      | Define max songs count per queue                                                                                                            | ❌        |
| `BOT_MAX_SONGS_HISTORY_SIZE` | 60                                                                       | Define max songs history per guild, set to 0 if you want to disable history (this will not delete history in database which already exists) | ❌        |
| `BOT_LANGUAGE`               | en                                                                       | Supported values: en ru                                                                                                                     | ❌        |
| `MONGO_URI`                  | Docker: mongodb://aicbot-mongo:27017 or Local: mongodb://localhost:27017 | IP address of MongoDB                                                                                                                       | ✔️       |
| `MONGO_DATABASE_NAME`        | aicbot                                                                   | Database name in MongoDB                                                                                                                    | ✔️       |
| `BOT_DISCORD_TOKEN`          | ODEzNzUwMTY1N...                                                         | Token from Discord Developer Portal                                                                                                         | ✔️       |
| `BOT_DISCORD_CLIENT_ID`      | 813750165783...                                                          | Application ID from Discord Developer Portal                                                                                                | ✔️       |
| `BOT_DISCORD_OVERPOWERED_ID` | 29016845994426....                                                       | Discord bot owner user ID, required for having more bot control for owner                                                                   | ✔️       |
| `BOT_SPOTIFY_CLIENT_SECRET`  |                                                                          | Used when the Spotify module cannot get the credentials automatically                                                                       | ❌        |
| `BOT_SPOTIFY_CLIENT_ID`      |                                                                          | Used when the Spotify module get the credentials automatically                                                                              | ❌        |
| `BOT_YANDEXMUSIC_TOKEN`      |                                                                          | Provide to enable Yandex Music module                                                                                                       | ❌        |
| `BOT_YANDEXMUSIC_UID`        |                                                                          | Provide to enable Yandex Music module                                                                                                       | ❌        |
| `BOT_VKONTAKTE_TOKEN`        |                                                                          | Provide to fetch songs from VKontakte                                                                                                       | ❌        |
| `BOT_SOUNDCLOUD_CLIENT_ID`   |                                                                          | Provide to fetch more data with SoundCloud Go+ account                                                                                      | ❌        |
| `BOT_SOUNDCLOUD_TOKEN`       |                                                                          | Provide to fetch more data with SoundCloud Go+ account                                                                                      | ❌        |
| `BOT_GENIUS_TOKEN`           |                                                                          | Provide to fetch songs lyrics from Genius                                                                                                   | ❌        |

## 🐋 Run in Docker (recommended) {#run-in-docker}

:::danger

MONGO_URI in .env.production must be mongodb://aicbot-mongo:27017.

:::

- Install [Docker](https://www.docker.com/get-started/)
- Copy [docker-compose.yml](https://github.com/AlexInCube/AlCoTest/blob/master/docker-compose.yml) in empty folder
- Follow the [Configure .env](#configure-env) section and copy .env.production in folder with docker-compose.yml.
- (Optional) Follow the [YouTube Cookie](./api-configure.md#youtube-cookie) section and copy yt-cookies.json in the folder with docker-compose.yml etc.
- Your file structure must be like this

```
AICoTest/
  ├─ .env.production
  ├─ docker-compose.yml
  ├─ yt-cookies.json
```

- Copy [updateAndRunInDocker.sh](https://github.com/AlexInCube/AlCoTest/blob/master/updateAndRunInDocker.sh) (for Linux, Git Bash and terminals) or [updateAndRunInDocker.bat](https://github.com/AlexInCube/AlCoTest/blob/master/updateAndRunInDocker.bat) for Windows
- Run command `sh updateAndRunInDocker.sh` for terminals or run updateAndRunInDocker.bat on Windows

## 🖥️ Run locally (if you are not a developer, this way is no sense) {#run-locally}

- Install [Node.js 22](https://nodejs.org/en/download/prebuilt-installer) or higher
- Install [Python 3.12](https://www.python.org/downloads/)
- Install C++ compiler. Follow this [guide](https://github.com/nodejs/node-gyp#on-windows)
- Install FFMpeg. Follow this [guide](https://www.wikihow.com/Install-FFmpeg-on-Windows)
- Clone repository to your computer
- Follow the [Configure .env](#configure-env) section and copy .env.development in folder with repository.
- (Optional) Follow the [YouTube Cookie](./api-configure.md#youtube-cookie) and copy yt-cookies.json in the folder with repository.
- Install Node.js packages in the folder with repository

```
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

## 🧪 Development checks {#development-checks}

All checks run from one command, the same one CI runs. Tool versions are pinned in `mise.toml`.

- Install [mise](https://mise.jdx.dev/getting-started.html)
- Put the mise shims folder on your PATH, so git hooks can find the tools. On Windows, run in PowerShell and reopen the terminal:

```powershell
[Environment]::SetEnvironmentVariable('Path', "$env:LOCALAPPDATA\mise\shims;" + [Environment]::GetEnvironmentVariable('Path', 'User'), 'User')
```

On Linux and macOS, add `eval "$(mise activate bash)"` (or `zsh`) to your shell profile instead.

- Install the tools, packages and git hooks in the folder with repository

```
mise install
pnpm install
hk install
```

- `mise run check` runs every check, `mise run fix` applies the safe autofixes (formatting, spelling), `mise run links` checks links in the docs

The commit hook checks formatting, lint, spelling, the Dockerfile, workflows and secrets in the staged files. The push hook runs the type check, Knip and a secret scan of the git history.

## 📚 Documentation site {#documentation-site}

These docs are a [Docusaurus](https://docusaurus.io/) site in the `website` folder. It has its own packages, so the bot install never pulls it.

- `mise run docs` installs the site packages and starts it with live reload at `http://localhost:3000/AlCoTest/`
- `mise run docs:build` builds it the way CI does and fails on broken links or anchors

Pushes to `master` that touch `website` publish the site to GitHub Pages.
