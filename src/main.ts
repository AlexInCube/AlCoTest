import {Client, GatewayIntentBits, Partials} from "discord.js";
import {loggerSend} from "./utilities/logger.js";
import {loginBot} from "./utilities/loginBot.js";
import {AudioPlayer} from "./commands/audio/audioPlayer/AudioPlayer.js";
import loadLocale from "./locales/Locale.js"

import * as dotenv from 'dotenv'
dotenv.config({ path: `.env.${process.env.NODE_ENV}` })

import i18next from "i18next";

await loadLocale()

import {handlersLoad} from "./handlers/handlersLoad.js";

switch (process.env.NODE_ENV){
    case "development": {
        loggerSend(i18next.t("mode_is_developer"))
        break
    }
    case "production": {
        loggerSend(i18next.t("mode_is_production"))
        break
    }
    default:
        loggerSend(`${i18next.t("mode_is_unknown")} ${process.env.NODE_ENV}`)
}

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.GuildModeration
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
})

client.rest.on("rateLimited", data => {
    loggerSend(`Client encountered a rate limit: ${data}`)
})
new AudioPlayer(client);
await handlersLoad(client)

loginBot()

process.on('uncaughtException', (err) => {
    loggerSend(err);
});
