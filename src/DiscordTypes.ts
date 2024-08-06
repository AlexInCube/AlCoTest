import { Client, ClientEvents, Collection } from 'discord.js';
import { ICommand, ICommandGroup } from './CommandTypes.js';
import { AudioPlayersManager } from './audioplayer/AudioPlayersManager.js';

declare module 'discord.js' {
  export interface Client {
    commands: Collection<string, ICommand>;
    commandsGroups: Collection<string, ICommandGroup>;
    audioPlayer: AudioPlayersManager;
  }
}

export interface BotEvent {
  name: keyof ClientEvents;
  once?: boolean | false;
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  execute: (client: Client, ...args: any) => void;
}
