import { Client } from 'discord.js';
import getDirName from './utilities/getDirName.js';
import fs from 'node:fs/promises';
import { loggerError, loggerSend } from './utilities/logger.js';
import { ENV } from './EnvironmentVariables.js';
import path from 'path';
import { pathToFileURL } from 'url';

const loggerPrefixHandlersManager = 'Handlers';
export async function handlersLoad(client: Client): Promise<void> {
  try {
    const handlersDir = path.join(getDirName(import.meta.url), 'handlers');
    const handlersFiles = await getAllHandlersFilesInDir(handlersDir);

    for (const file of handlersFiles) {
      if (ENV.BOT_VERBOSE_LOGGING) loggerSend(`Try to load handler from: ${file}`, loggerPrefixHandlersManager);

      const handlerPath = pathToFileURL(path.join(handlersDir, file)).href;

      const handler = await import(handlerPath);
      await handler.default(client);

      if (ENV.BOT_VERBOSE_LOGGING) loggerSend(`Handler is loaded from: ${file}`, loggerPrefixHandlersManager);
    }

    loggerSend(`Loaded handlers: ${handlersFiles.length} total`, loggerPrefixHandlersManager);
  } catch (e) {
    loggerError(e);
    loggerSend('Bot is shutting down, because handler loading throw error', loggerPrefixHandlersManager);
    process.exit();
  }
}

async function getAllHandlersFilesInDir(handlersDir: string): Promise<string[]> {
  const dirFiles: string[] = await fs.readdir(handlersDir);

  const handlersFiles: string[] = [];
  dirFiles.forEach((file) => {
    if (file.endsWith('.handler.js')) {
      handlersFiles.push(file);
    }
  });

  return handlersFiles;
}
