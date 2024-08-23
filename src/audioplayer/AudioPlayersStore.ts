import { Client, Collection, GuildTextBasedChannel } from 'discord.js';
import { Queue } from 'distube';
import { PlayerInstance } from './PlayerInstance.js';

export class AudioPlayersStore {
  private readonly client: Client;
  private readonly collection = new Collection<string, PlayerInstance>();
  constructor(_client: Client) {
    this.client = _client;
  }
  async add(guildId: string, textChannel: GuildTextBasedChannel, queue: Queue): Promise<PlayerInstance | undefined> {
    if (this.client.guilds.cache.get(guildId)) {
      if (!this.collection.has(guildId)) {
        this.collection.set(guildId, new PlayerInstance(this.client, textChannel, queue));
      }

      return this.collection.get(guildId);
    }

    return undefined;
  }

  get(guildId: string): PlayerInstance | undefined {
    return this.collection.get(guildId);
  }

  async remove(guildId: string) {
    const player = this.get(guildId);
    if (player) {
      await player.destroy();
      this.collection.delete(guildId);
    }
  }

  has(guildId: string): boolean {
    return this.collection.has(guildId);
  }

  debug(): string {
    let str = `Players Count: ${this.collection.size}\n`;
    this.collection.forEach((player) => {
      str += player.debug();
    });

    return str;
  }
}
