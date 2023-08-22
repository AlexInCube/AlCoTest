import {Client} from "discord.js";
import {BotEvent} from "../Types.js";
import {loggerSend} from "../utilities/logger.js";
import getDirName from "../utilities/getDirName.js";
import fs from "node:fs/promises";
import path from "path";
import {pathToFileURL} from "url";
import {ENV} from "../EnvironmentVariables.js";

export const loggerPrefixEventHandler = "Events"

const handler = async (client: Client) => {
    const eventsDir: string = path.join(getDirName(import.meta.url), "../events")

    const eventsFiles: string[] = await getAllEventsFilesInDir(eventsDir);

    for (const file of eventsFiles) {
        if (!file.endsWith(".event.js")) return;

        const importPath = pathToFileURL(path.resolve(eventsDir, file)).toString()
        if (ENV.BOT_VERBOSE_LOGGING) loggerSend(`Try to load event from: ${importPath}`, loggerPrefixEventHandler)

        const eventModule = await import(importPath)
        const event: BotEvent = eventModule.default

        if (event.once) {
            client.once(event.name, (...args) => event.execute(client, ...args))
        } else {
            client.on(event.name, (...args) => event.execute(client, ...args))
        }

        if (ENV.BOT_VERBOSE_LOGGING) loggerSend(`Event ${event.name} is loaded from: ${importPath}`, loggerPrefixEventHandler)
    }

    loggerSend(`Loaded events: ${eventsFiles.length} total`, loggerPrefixEventHandler)
}

async function getAllEventsFilesInDir(eventsDir: string) {
    const dirFiles: string[] = await fs.readdir(eventsDir);

    const eventsFiles: string[] = []
    dirFiles.forEach((file) => {
        if (file.endsWith('.event.js')) {
            eventsFiles.push(file)
        }
    })

    return eventsFiles
}


export default handler
