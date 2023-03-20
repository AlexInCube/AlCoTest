import {Collection} from "discord.js";
import {ICommand, ICommandGroup} from "./CommandTypes";
import {AudioPlayer} from "./commands/audio/audioPlayer/AudioPlayer";

declare module "discord.js" {
    export interface Client {
        commands: Collection<string, ICommand>,
        commandsGroups: Collection<string, ICommandGroup>
        audioPlayer: AudioPlayer
    }
}

export interface BotEvent {
    name: string,
    once?: boolean | false,
    execute: (...args: any) => void
}

