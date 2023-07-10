import {Client, Collection} from "discord.js";
import {ICommand, ICommandGroup} from "./CommandTypes.js";
import {AudioPlayerCore} from "./commands/audio/audioPlayer/AudioPlayerCore.js";

declare module "discord.js" {
    export interface Client {
        commands: Collection<string, ICommand>,
        commandsGroups: Collection<string, ICommandGroup>
        audioPlayer: AudioPlayerCore
    }
}

export interface BotEvent {
    name: string,
    once?: boolean | false,
    execute: (client: Client, ...args: any) => void
}

