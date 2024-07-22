# syntax=docker/dockerfile:1
FROM node:20-alpine as base
RUN apk update && apk upgrade && apk add ffmpeg && apk add python3

FROM base as build
RUN apk add build-base && apk add make
RUN npm i -g pnpm@latest
WORKDIR /botbuild
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm run build
RUN pnpm prune --prod

FROM base as prod

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

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 aicbot

WORKDIR /bot
COPY --from=build /botbuild/build ./build
COPY --from=build /botbuild/node_modules ./node_modules
COPY --from=build /botbuild/package.json .

RUN chown -R aicbot:nodejs /bot

USER aicbot

CMD ["npm", "run", "production"]
