import { ENV } from '../EnvironmentVariables.js';
import { Client } from 'discord.js';

export async function loginBot(client: Client) {
  void (await client.login(ENV.BOT_DISCORD_TOKEN));
}
