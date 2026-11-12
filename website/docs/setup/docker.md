---
sidebar_position: 3
sidebar_label: Run in Docker
---

# 🐋 Run in Docker (recommended)

:::danger

MONGO_URI in .env.production must be mongodb://aicbot-mongo:27017.

:::

- Install [Docker](https://www.docker.com/get-started/)
- Copy [docker-compose.yml](https://github.com/AlexInCube/AlCoTest/blob/master/docker-compose.yml) in empty folder
- Follow the [Configure .env](./configure-env.md) section and copy .env.production in folder with docker-compose.yml.
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
