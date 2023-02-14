import {Collection} from "discord.js";
import {ICommand} from "./CommandTypes";

declare module "discord.js" {
    export interface Client {
        commands: Collection<string, ICommand>,
        commandsGroups: Collection<string, ICommand[]>
    }
}

export interface BotEvent {
    name: string,
    once?: boolean | false,
    execute: (...args: any) => void
}

