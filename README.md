<p align="center">
    <img width="96" src="icons/logo.png" alt="BotLogo">
</p>
<h1 align="center">AICTest</h1>
<p align="center">
Cool audiobot for Discord created by <a href="https://vk.com/alexincube"><b>@AlexInCube</b></a></p>

## 🖥️ Setup
- Go to [Wiki Setup Section](https://github.com/AlexInCube/AlCoTest/wiki/Setup)

## 🌟 Features
![play-audioplayer](/wiki/images/commands/play-audioplayer.png)
- Audioplayer based on [Riffy](https://github.com/riffy-team/riffy) (Lavalink interface for Node.js)
- Playlists for songs
- Lyrics for songs
- Downloading of songs via /download command
- Support YouTube, Spotify, Soundcloud, Apple Music, any HTTP-stream and Discord Attachments (/playfile support MP3/WAV/OGG)
- Support Slash and Text commands system (with customizable prefix per server using /setprefix)
- Localization (English and Russian are currently supported)
- Command /alcotest which shows your alcohol count in blood
- Go to [Wiki](https://github.com/AlexInCube/AlCoTest/wiki) to get more information about features, commands, and others.

## 🐛 Bugs or problems

If you have issues, try to update your `docker-compose.yml`, `updateAndRunInDocker.sh` files.
And run `sh updateAndRunInDocker.sh`. 
If bugs are persisted on the latest version of bot,
please create [issue](https://github.com/AlexInCube/AlCoTest/issues/new/choose).

## Migration Guide from v3 to v4

The bot rewrote to use Lavalink instead of Distube.js to provide more services and stability.
Now you need to provide the lavanodes.json and set up your lavaserver.
