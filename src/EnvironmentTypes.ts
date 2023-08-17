import {z} from "zod"
import * as dotenv from "dotenv";
import {loggerSend} from "./utilities/logger.js";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` })
loggerSend(`Loaded .env.${process.env.NODE_ENV}`)

const envVariables = z.object({
    NODE_ENV: z.enum(['development', 'production']),
    BOT_LANGUAGE: z.enum(['en', 'ru']),
    BOT_COMMAND_PREFIX: z.string().min(1),

    MONGO_URI: z.string(),
    MONGO_DATABASE_NAME: z.string(),

    BOT_DISCORD_TOKEN: z.string(),
    BOT_DISCORD_CLIENT_ID: z.string(),
    BOT_DISCORD_OVERPOWERED_ID: z.string(),

    BOT_YOUTUBE_COOKIE: z.string().optional(),

    BOT_SOUNDCLOUD_CLIENT_ID: z.string().optional(),
    BOT_SOUNDCLOUD_TOKEN: z.string().optional(),

    BOT_SPOTIFY_CLIENT_SECRET: z.string().optional(),
    BOT_SPOTIFY_CLIENT_ID: z.string().optional(),

    BOT_YANDEXMUSIC_TOKEN: z.string().optional(),
})

export const ENV = envVariables.parse(process.env)
