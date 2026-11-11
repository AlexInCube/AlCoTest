# syntax=docker/dockerfile:1
# Baseline: each "hadolint ignore" line marks a finding that existed when Hadolint was adopted (review 2027-05-11)
FROM node:22-alpine AS base
# hadolint ignore=DL3018,DL3019
RUN apk update && apk upgrade && apk add ffmpeg && apk add python3
# hadolint ignore=DL3018
RUN apk add --no-cache tzdata

FROM base AS build
# hadolint ignore=DL3018,DL3019
RUN apk add build-base && apk add make
RUN npm i -g pnpm@latest

WORKDIR /botbuild
COPY .. .
RUN pnpm install --frozen-lockfile
# hadolint ignore=DL3059
RUN pnpm run build
# hadolint ignore=DL3059
RUN pnpm prune --prod

FROM base AS prod

RUN addgroup --system --gid 1001 nodejs
# hadolint ignore=DL3059
RUN adduser --system --uid 1001 aicbot

WORKDIR /bot
COPY --chown=aicbot:nodejs --from=build /botbuild/build ./build
COPY --chown=aicbot:nodejs --from=build /botbuild/node_modules ./node_modules
COPY --chown=aicbot:nodejs --from=build /botbuild/package.json .

RUN mkdir "downloads"
# hadolint ignore=DL3059
RUN chmod -R 777 "downloads"

# hadolint ignore=DL3066
USER aicbot

CMD ["npm", "run", "production"]
