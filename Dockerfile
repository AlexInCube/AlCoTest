# syntax=docker/dockerfile:1
FROM bitnami/node:18.16.0
RUN apt update
RUN apt install git
RUN apt install -y ffmpeg
RUN npm i -g pnpm@latest
RUN mkdir -p /bot
WORKDIR /bot
RUN git clone https://github.com/AlexInCube/AlCoTest .
RUN pnpm install
RUN pnpm run build
COPY .env.production /bot
COPY yt-cookies.json /bot
CMD ["pnpm", "run", "production"]
