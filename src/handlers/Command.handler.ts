import {Client, Collection, REST, Routes} from "discord.js";
import {loggerSend} from "../utilities/logger";
import {ICommand, ICommandGroup, SlashBuilder} from "../CommandTypes";
import * as fs from "fs";
import * as path from "path";
import "../Types"
import * as process from "process";

export const loggerPrefixCommandHandler = "[ Commands ] "

const handler = async (client: Client) => {
    //loggerSend(`${loggerPrefixCommandHandler} Начинаем загружать команды.`)

    const commands = new Collection<string, ICommand>()
    const commandsGroups = new Collection<string, ICommandGroup>()

    client.commands = commands
    client.commandsGroups = commandsGroups

    const commandsPath = path.join(__dirname,"../commands")

    const scanResult = getAllCommandFilesInDir(commandsPath)
    const buildersArray: SlashBuilder[] = []

    scanResult.forEach((filePath) => {
        const command: ICommand = require(filePath).default
        const group: ICommandGroup = command.group

        commands.set(command.name, command)

        if (!commandsGroups.has(group.name)) {
            commandsGroups.set(group.name, group)
            group.commands = [command]
        }else{
            const groupInGroups = commandsGroups.get(group.name)
            groupInGroups?.commands?.push(command)
        }

        if (command.slash_builder){
            buildersArray.push(command.slash_builder)
        }
    })

    const rest = new REST({ version: '10' }).setToken(process.env.BOT_DISCORD_TOKEN)

    await rest.put(Routes.applicationCommands(process.env.BOT_DISCORD_CLIENT_ID),
        { body: buildersArray }
    ).then(() => {
        loggerSend(`${loggerPrefixCommandHandler} Загружено команд: ${scanResult.length}`)
    }).catch((error) => {
        loggerSend(`${loggerPrefixCommandHandler} ${error}`)
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

