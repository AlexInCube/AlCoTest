---
sidebar_position: 1
sidebar_label: Run locally
---

# 🖥️ Run locally

If you only want to host the bot, [run it in Docker](../setup/docker.md) instead.

[mise](https://mise.jdx.dev/) installs the pinned Node.js, pnpm and every check tool from `mise.toml`, so you don't install them yourself.

1. Install [mise](https://mise.jdx.dev/getting-started.html).
2. Put the mise shims folder on your PATH, so git hooks can find the tools. On Windows, run in PowerShell and reopen the terminal:

   ```powershell
   [Environment]::SetEnvironmentVariable('Path', "$env:LOCALAPPDATA\mise\shims;" + [Environment]::GetEnvironmentVariable('Path', 'User'), 'User')
   ```

   On Linux and macOS, add `eval "$(mise activate bash)"` (or `zsh`) to your shell profile instead.

3. Install [FFmpeg](https://ffmpeg.org/download.html), the bot needs it on PATH to play audio. For example `winget install Gyan.FFmpeg` on Windows, `brew install ffmpeg` on macOS, `sudo apt install ffmpeg` on Debian and Ubuntu.
4. Clone the repository, then in its folder install the tools, packages and git hooks:

   ```bash
   mise install
   pnpm install
   hk install
   ```

5. Follow the [Configure .env](../setup/configure-env.md) section and put `.env.development` in the repository folder.
6. (Optional) Follow the [YouTube Cookie](../setup/api-configure.md#youtube-cookie) section and put `yt-cookies.json` in the repository folder.
7. Compile and start the bot:

   ```bash
   pnpm run development
   ```

   To run it with `.env.production` instead, use `pnpm run build` and then `pnpm run production`.

:::note

Native packages such as `@discordjs/opus` ship prebuilt binaries for common systems. If `pnpm install` fails while building one, install Python and a C++ compiler as the [node-gyp guide](https://github.com/nodejs/node-gyp#installation) describes, then run `pnpm install` again.

:::
