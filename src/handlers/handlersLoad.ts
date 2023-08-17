import {Client} from "discord.js";
import getDirName from "../utilities/getDirName.js";
import fs from "node:fs/promises";
import {loggerSend} from "../utilities/logger.js";
import {ENV} from "../EnvironmentTypes.js";

const loggerPrefixHandlersManager = "Handlers"
export async function handlersLoad(client: Client): Promise<void> {
    const handlersDir = getDirName(import.meta.url)
    const handlersFiles = await getAllHandlersFilesInDir(handlersDir)

    for (const file of handlersFiles) {
        if (ENV.BOT_VERBOSE_LOGGING) loggerSend(`Try to load handler from: ${file}`, loggerPrefixHandlersManager)

        const handler = await import(`./${file}`)
        await handler.default(client);

        if (ENV.BOT_VERBOSE_LOGGING) loggerSend(`Handler is loaded from: ${file}`, loggerPrefixHandlersManager)
    }

    loggerSend(`Loaded handlers: ${handlersFiles.length} total`, loggerPrefixHandlersManager)
}

async function getAllHandlersFilesInDir(handlersDir: string): Promise<string[]> {
    const dirFiles: string[] = await fs.readdir(handlersDir);

    const handlersFiles: string[] = []
    dirFiles.forEach((file) => {
        if (file.endsWith('.handler.js')) {
            handlersFiles.push(file)
        }
    })

    return handlersFiles
}
