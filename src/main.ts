import {Client, GatewayIntentBits, Partials} from "discord.js";
import {loggerSend} from "./utilities/logger";
import * as path from "path";
import * as fs from "fs";
import {loginBot} from "./utilities/loginBot";
import {AudioPlayer} from "./commands/audio/audioPlayer/AudioPlayer";


require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })

switch (process.env.NODE_ENV){
    case "development": {
        loggerSend("Включен режим РАЗРАБОТКИ")
        break
    }
    case "production": {
        loggerSend("Включен режим РЕЛИЗ (молимся чтобы всё хорошо работало)")
        break
    }
    default:
        loggerSend(`НЕИЗВЕСТНЫЙ РЕЖИМ: ${process.env.NODE_ENV}`)
}

loggerSend(`Установлен часовой пояс: ${process.env.TZ}`)

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
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
    shards: 'auto'
})

client.rest.on('rateLimited', (rateLimited) => {
    loggerSend(`RATE LIMIT, PLEASE SLOWDOWN`)
    loggerSend(rateLimited)
})

export const Audio = new AudioPlayer(client)
//export const Downloads = new DownloadsManager()

const handlersDir = path.join(__dirname, "./handlers")
fs.readdirSync(handlersDir).forEach((handler: any) => {
    if (!handler.endsWith(".handler.js")) return
    require(`${handlersDir}/${handler}`).default(client)
})

loginBot()

process.on('uncaughtException', (err) => {
    loggerSend(err);
});
