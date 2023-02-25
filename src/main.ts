import {Client, GatewayIntentBits, Partials} from "discord.js";
import {loggerSend} from "./utilities/logger";
import * as path from "path";
import * as fs from "fs";
import {loginBot} from "./utilities/loginBot";
import {AudioPlayer} from "./commands/audio/audioPlayer/AudioPlayer";

require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })

if (process.env.NODE_ENV == "development"){
    loggerSend("Включен режим РАЗРАБОТКИ")
}else{
    loggerSend("Включен режим РЕЛИЗ (молимся чтобы всё хорошо работало)")
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
        GatewayIntentBits.DirectMessageTyping
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
    shards: 'auto'
})

export const Audio = new AudioPlayer(client)

const handlersDir = path.join(__dirname, "./handlers")
fs.readdirSync(handlersDir).forEach((handler: any) => {
    if (!handler.endsWith(".handler.js")) return
    require(`${handlersDir}/${handler}`).default(client)
})

loginBot()