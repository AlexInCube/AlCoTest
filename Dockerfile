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
WORKDIR /bot
COPY --from=build /botbuild/build ./build
COPY --from=build /botbuild/node_modules ./node_modules
COPY --from=build /botbuild/package.json .
CMD ["npm", "run", "production"]
