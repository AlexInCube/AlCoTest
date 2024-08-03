import { z } from 'zod';
import * as dotenv from 'dotenv';
import { loggerSend } from './utilities/logger.js';
import path from 'path';
import fs from 'fs';

const loggerPrefixEnv = 'ENV';

const envPath = path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}`);

loggerSend(`Checking environment variables in ${envPath}`, loggerPrefixEnv);
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  loggerSend(`Environment variables is found in ${envPath}`, loggerPrefixEnv);
} else {
  loggerSend(
    `Environment variables are not found in ${envPath}, trying to load variables from OS environment variables`,
    loggerPrefixEnv
  );
}

const envVariables = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),

  BOT_VERBOSE_LOGGING: z
    .preprocess(
      (v) =>
        z
          .enum(['true', 'false'])
          .transform((v) => JSON.parse(v))
          .catch(v)
          .parse(v),
      z.boolean()
    )
    .optional()
    .default(false),
  BOT_FFMPEG_LOGGING: z
    .preprocess(
      (v) =>
        z
          .enum(['true', 'false'])
          .transform((v) => JSON.parse(v))
          .catch(v)
          .parse(v),
      z.boolean()
    )
    .optional()
    .default(false),

  BOT_LANGUAGE: z.enum(['en', 'ru']).optional().default('en'),
  BOT_COMMAND_PREFIX: z.string().min(1),

  BOT_MAX_SONGS_IN_QUEUE: z.coerce.number().positive().min(1).optional().default(500),

  MONGO_URI: z.string(),
  MONGO_DATABASE_NAME: z.string(),

  BOT_DISCORD_TOKEN: z.string(),
  BOT_DISCORD_CLIENT_ID: z.string(),
  BOT_DISCORD_OVERPOWERED_ID: z.string(),

  BOT_GOOGLE_EMAIL: z.string().optional(),
  BOT_GOOGLE_PASSWORD: z.string().optional(),

  BOT_SOUNDCLOUD_CLIENT_ID: z.string().optional(),
  BOT_SOUNDCLOUD_TOKEN: z.string().optional(),

  BOT_SPOTIFY_CLIENT_SECRET: z.string().optional(),
  BOT_SPOTIFY_CLIENT_ID: z.string().optional(),

  BOT_YANDEXMUSIC_TOKEN: z.string().optional(),
  BOT_YANDEXMUSIC_UID: z.coerce.number().optional(),

  BOT_GENIUS_TOKEN: z.string().optional()
});

export const ENV = envVariables.parse(process.env);

if (fs.existsSync(envPath)) {
  loggerSend(`Environment variables is loaded from ${envPath}`, loggerPrefixEnv);
} else {
  loggerSend(`Environment variables is loaded from OS environment variables`, loggerPrefixEnv);
}
