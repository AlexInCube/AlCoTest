import { Client, Collection, TextChannel } from 'discord.js';
import { Queue } from 'distube';
import { MessagePlayer } from './MessagePlayer.js';

export class AudioPlayersManager {
  private readonly client: Client;
  private readonly collection = new Collection<string, MessagePlayer>();
  constructor(_client: Client) {
    this.client = _client;
  }
  async add(
    guildId: string,
    textChannel: TextChannel,
    queue: Queue
  ): Promise<MessagePlayer | undefined> {
    if (await this.client.guilds.cache.get(guildId)) {
      if (!this.collection.has(guildId)) {
        this.collection.set(guildId, new MessagePlayer(this.client, textChannel, queue));
      }

      return this.collection.get(guildId);
    }

    return undefined;
  }

  get(guildId: string): MessagePlayer | undefined {
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
