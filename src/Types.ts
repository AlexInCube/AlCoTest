import {Client, Collection} from "discord.js";
import {ICommand, ICommandGroup} from "./CommandTypes.js";
import {AudioPlayer} from "./commands/audio/audioPlayer/AudioPlayer.js";

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
    execute: (client: Client, ...args: any) => void
}

