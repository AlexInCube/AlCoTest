import {Client, GatewayIntentBits, Partials} from "discord.js";
import {loggerError} from "./utilities/logger.js";
import {loginBot} from "./utilities/loginBot.js";
import {AudioPlayerCore} from "./commands/audio/audioPlayer/AudioPlayerCore.js";
import loadLocale from "./locales/Locale.js"

await loadLocale()

import {handlersLoad} from "./handlers/handlersLoad.js";

const client = new Client({
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

client.rest.on("rateLimited", (args) => {
    loggerError(`Client encountered a rate limit: ${JSON.stringify(args)}`)
})
new AudioPlayerCore(client);
await handlersLoad(client)

loginBot(client)

process.on('uncaughtException', (err) => {
    loggerError(err);
});
