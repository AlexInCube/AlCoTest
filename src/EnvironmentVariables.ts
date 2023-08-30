import {z} from "zod"
import * as dotenv from "dotenv";
import {loggerError, loggerSend} from "./utilities/logger.js";
import fs from "fs";

const loggerPrefixEnv = "ENV"

dotenv.config({ path: `.env.${process.env.NODE_ENV}` })
loggerSend(`Loaded .env.${process.env.NODE_ENV}`, loggerPrefixEnv)

const envVariables = z.object({
    NODE_ENV: z.enum(['development', 'production']),

    BOT_VERBOSE_LOGGING:
        z.preprocess((v) => z.enum(['true', 'false'])
        .transform((v) =>
            JSON.parse(v)).catch(v).parse(v),z.boolean()).optional().default(false),

    BOT_LANGUAGE: z.enum(['en', 'ru']).optional().default('en'),
    BOT_COMMAND_PREFIX: z.string().min(1),

    MONGO_URI: z.string(),
    MONGO_DATABASE_NAME: z.string(),

    BOT_DISCORD_TOKEN: z.string(),
    BOT_DISCORD_CLIENT_ID: z.string(),
    BOT_DISCORD_OVERPOWERED_ID: z.string(),

    BOT_SOUNDCLOUD_CLIENT_ID: z.string().optional(),
    BOT_SOUNDCLOUD_TOKEN: z.string().optional(),

    BOT_SPOTIFY_CLIENT_SECRET: z.string().optional(),
    BOT_SPOTIFY_CLIENT_ID: z.string().optional(),

    BOT_YANDEXMUSIC_TOKEN: z.string().optional(),
})

export const ENV = envVariables.parse(process.env)

export let BOT_YOUTUBE_COOKIE = undefined

try{
    BOT_YOUTUBE_COOKIE = JSON.parse(fs.readFileSync("yt-cookies.json", { encoding: 'utf8', flag: 'r' }))
    loggerSend("Cookie file is loaded", loggerPrefixEnv)
}catch (e) {
    loggerError("Cookie file is not provided or cookie is wrong. Please, follow this instructions https://distube.js.org/#/docs/DisTube/main/general/cookie", loggerPrefixEnv)
}


