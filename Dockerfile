# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
RUN apk update && apk upgrade && apk add ffmpeg && apk add python3
RUN apk add --no-cache tzdata

FROM base AS build
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN apk add build-base && apk add make
RUN npm i -g pnpm@latest

WORKDIR /botbuild
COPY .. .
RUN pnpm install --frozen-lockfile
RUN pnpm run build
RUN pnpm prune --prod

FROM base AS prod

RUN apk update && apk add --no-cache nmap && \
echo @edge https://dl-cdn.alpinelinux.org/alpine/edge/community >> /etc/apk/repositories && \
echo @edge https://dl-cdn.alpinelinux.org/alpine/edge/main >> /etc/apk/repositories && \
apk update && \
apk add --no-cache \
chromium \
harfbuzz \
"freetype>2.8" \
ttf-freefont \
nss

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 aicbot

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /bot
COPY --chown=aicbot:nodejs --from=build /botbuild/build ./build
COPY --chown=aicbot:nodejs --from=build /botbuild/node_modules ./node_modules
COPY --chown=aicbot:nodejs --from=build /botbuild/package.json .

RUN mkdir "downloads"
RUN chmod -R 777 "downloads"

USER aicbot

CMD ["npm", "run", "production"]
