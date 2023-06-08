import {Client} from "discord.js";
import getDirName from "../utilities/getDirName.js";
import fs from "node:fs/promises";
import {loggerSend} from "../utilities/logger.js";
import i18next from "i18next";
export const loggerPrefixHandlersManager = "Handlers"
export async function handlersLoad(client: Client): Promise<void> {
    const handlersDir = getDirName(import.meta.url)
    const handlersFiles = await getAllHandlersFilesInDir(handlersDir)

    await Promise.all(handlersFiles.map(async (file) => {
        const handler = await import(`./${file}`)
        return handler.default(client);
    }));

    loggerSend(i18next.t("handlers_loaded", {total: handlersFiles.length}), loggerPrefixHandlersManager)
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
