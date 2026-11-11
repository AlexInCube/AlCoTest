# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
RUN apk update && apk upgrade && apk add ffmpeg && apk add python3
RUN apk add --no-cache tzdata

FROM base AS build
RUN apk add build-base && apk add make
RUN npm i -g pnpm@latest

WORKDIR /botbuild
COPY .. .
RUN pnpm install --frozen-lockfile
RUN pnpm run build
RUN pnpm prune --prod

FROM base AS prod

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 aicbot

WORKDIR /bot
COPY --chown=aicbot:nodejs --from=build /botbuild/build ./build
COPY --chown=aicbot:nodejs --from=build /botbuild/node_modules ./node_modules
COPY --chown=aicbot:nodejs --from=build /botbuild/package.json .

RUN mkdir "downloads"
RUN chmod -R 777 "downloads"

USER aicbot

CMD ["npm", "run", "production"]
