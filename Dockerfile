# syntax=docker/dockerfile:1
FROM node:19
RUN apt update
RUN apt install -y ffmpeg
RUN npm i -g pnpm
RUN mkdir -p /bot
WORKDIR /bot
COPY package.json /bot
COPY /build /bot/build
COPY .env.production /bot/build
COPY .env.production /bot
RUN pnpm install --production=true
CMD ["npm", "run", "production"]
