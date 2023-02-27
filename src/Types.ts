import {Collection} from "discord.js";
import {ICommand, ICommandGroup} from "./CommandTypes";
import {DisTube} from "distube";

declare module "discord.js" {
    export interface Client {
        commands: Collection<string, ICommand>,
        commandsGroups: Collection<string, ICommandGroup>
        distube: DisTube
    }
}

export interface BotEvent {
    name: string,
    once?: boolean | false,
    execute: (...args: any) => void
}

