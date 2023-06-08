# syntax=docker/dockerfile:1
FROM bitnami/node:18.16.0
RUN apt update
RUN apt install git
RUN apt install -y ffmpeg
RUN npm i -g pnpm@latest
RUN mkdir -p /bot
WORKDIR /bot
RUN git clone --branch 2.0-dev https://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@github.com/AlexInCube/AlCoTest .
RUN pnpm install
RUN pnpm run build
COPY .env.production /bot
CMD ["pnpm", "run", "production"]
