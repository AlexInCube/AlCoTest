import {Client, Collection, REST, Routes} from "discord.js";
import {loggerSend} from "../utilities/logger.js";
import {ICommand, ICommandGroup, SlashBuilder} from "../CommandTypes.js";
import * as fs from "fs";
import * as path from "path";
import "../Types.js"
import * as process from "process";
import getDirName from "../utilities/getDirName.js";
import i18next from "i18next";

export const loggerPrefixCommandHandler = "Commands"

const handler = async (client: Client) => {
    //loggerSend(`${loggerPrefixCommandHandler} Начинаем загружать команды.`)

    const commands = new Collection<string, ICommand>()
    const commandsGroups = new Collection<string, ICommandGroup>()

    client.commands = commands
    client.commandsGroups = commandsGroups

    const commandsDir =  path.join(getDirName(import.meta.url), "../commands")

    const scanResult: string[] = getAllCommandFilesInDir(commandsDir) // Recursion for scan "commands" folder for files end with ".command.js"
    const buildersArray: SlashBuilder[] = [] // Prepare builders array for send into Discord REST API

    await Promise.all(scanResult.map(async (filePath) => {
        const importPath = `file:///${filePath}`

        //loggerSend(`Try Load Command ${importPath}`, loggerPrefixCommandHandler)
        const commandModule = await import(importPath)

        const command: ICommand = commandModule.default
        const group: ICommandGroup = command.group

        commands.set(command.name, command)

        if (!commandsGroups.has(group.name)) { // If group not exists, let create it
            commandsGroups.set(group.name, group)
            group.commands.push(command)
        }else{ // If group exists, add command
            const groupInGroups = commandsGroups.get(group.name)
            groupInGroups?.commands?.push(command)
        }

        if (command.slash_builder){
            buildersArray.push(command.slash_builder)
        }

        //loggerSend(`Command Loaded ${importPath}`, loggerPrefixCommandHandler)
    }))

    const rest = new REST({ version: '10' }).setToken(process.env.BOT_DISCORD_TOKEN)

    await rest.put(Routes.applicationCommands(process.env.BOT_DISCORD_CLIENT_ID),
        { body: buildersArray }
    ).then(() => {
        loggerSend(i18next.t("commands_loaded", {total: scanResult.length}), loggerPrefixCommandHandler)
    }).catch((error) => {
        loggerSend(`${error}`, loggerPrefixCommandHandler)
    })
}

export default handler

function getAllCommandFilesInDir (dirPath: string, arrayOfFiles: string[] = []) {
    const files = fs.readdirSync(dirPath)

    files.forEach(function (file) {
        const foundedFile = fs.statSync(dirPath + '/' + file)
        if (foundedFile.isDirectory()) {
            arrayOfFiles = getAllCommandFilesInDir(dirPath + '/' + file, arrayOfFiles)
        } else {
            const pathToPush = path.join(dirPath, '/', file)
            if (pathToPush.endsWith('.command.js')) {
                arrayOfFiles.push(pathToPush)
            }
        }
    })

    return arrayOfFiles
}

