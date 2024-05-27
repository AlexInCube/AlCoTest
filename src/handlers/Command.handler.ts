import { Client, Collection, REST, Routes } from 'discord.js';
import { loggerError, loggerSend } from '../utilities/logger.js';
import { ICommand, ICommandGroup, SlashBuilder } from '../CommandTypes.js';
import * as fs from 'fs';
import * as path from 'path';
import '../Types.js';
import getDirName from '../utilities/getDirName.js';
import { ENV } from '../EnvironmentVariables.js';

export const loggerPrefixCommandHandler = 'Commands';

const handler = async (client: Client) => {
  const commands = new Collection<string, ICommand>();
  const commandsGroups = new Collection<string, ICommandGroup>();

  client.commands = commands;
  client.commandsGroups = commandsGroups;

  const commandsDir = path.join(getDirName(import.meta.url), '../commands');

  const scanResult: string[] = getAllCommandFilesInDir(commandsDir); // Recursion for scan "commands" folder for files end with ".command.js"
  const buildersArray: SlashBuilder[] = []; // Prepare builders array for send into Discord REST API

  for (const filePath of scanResult) {
    const importPath = `file:///${filePath}`;

    if (ENV.BOT_VERBOSE_LOGGING)
      loggerSend(`Try to load command from: ${importPath}`, loggerPrefixCommandHandler);

    const commandModule = await import(importPath);

    const command: ICommand = commandModule.default();
    const group: ICommandGroup = command.group;

    commands.set(command.text_data.name, command);

    if (!commandsGroups.has(group.name)) {
      // If a group not exists, let create it
      commandsGroups.set(group.name, group);
      group.commands.push(command);
    } else {
      // If a group exists, add command
      const groupInGroups = commandsGroups.get(group.name);
      groupInGroups?.commands?.push(command);
    }

    if (command?.slash_data && !command.hidden) {
      buildersArray.push(command.slash_data.slash_builder);
    }

    if (ENV.BOT_VERBOSE_LOGGING)
      loggerSend(
        `Command ${command.text_data.name} is loaded from: ${importPath}`,
        loggerPrefixCommandHandler
      );
  }

  const rest = new REST({ version: '10' }).setToken(ENV.BOT_DISCORD_TOKEN);

  await rest
    .put(Routes.applicationCommands(ENV.BOT_DISCORD_CLIENT_ID), { body: buildersArray })
    .then(() => {
      loggerSend(`Loaded commands: ${scanResult.length} total`, loggerPrefixCommandHandler);
    })
    .catch((error) => {
      loggerError(`${error}`, loggerPrefixCommandHandler);
    });
};

export default handler;

function getAllCommandFilesInDir(dirPath: string, arrayOfFiles: string[] = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(function (file) {
    const foundedFile = fs.statSync(dirPath + '/' + file);
    if (foundedFile.isDirectory()) {
      arrayOfFiles = getAllCommandFilesInDir(dirPath + '/' + file, arrayOfFiles);
    } else {
      const pathToPush = path.join(dirPath, '/', file);
      if (pathToPush.endsWith('.command.js')) {
        arrayOfFiles.push(pathToPush);
      }
    }
  });

  return arrayOfFiles;
}
