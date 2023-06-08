export {};

declare global{
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV: string,
            BOT_LANGUAGE: string
            BOT_COMMAND_PREFIX: string,
            BOT_DISCORD_TOKEN: string,
            BOT_DISCORD_CLIENT_ID: string,
            BOT_DISCORD_OVERPOWERED_ID: string,
            BOT_YOUTUBE_COOKIE: string,
            BOT_SPOTIFY_CLIENT_SECRET: string,
            BOT_SPOTIFY_CLIENT_ID: string,

            MONGO_URI: string;
            MONGO_DATABASE_NAME: string
        }
    }
}
