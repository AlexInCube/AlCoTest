import {Client} from "discord.js";
import getDirName from "../utilities/getDirName.js";
import fs from "node:fs/promises";
import {loggerSend} from "../utilities/logger.js";

export const loggerPrefixHandlersManager = "Handlers"
export async function handlersLoad(client: Client): Promise<void> {
    const handlersDir = getDirName(import.meta.url)
    const handlersFiles = await getAllHandlersFilesInDir(handlersDir)

    await Promise.all(handlersFiles.map(async (file) => {
        const handler = await import(`./${file}`)
        return handler.default(client);
    }));

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
