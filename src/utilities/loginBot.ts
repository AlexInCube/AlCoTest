import { ENV } from '../EnvironmentVariables.js';
import { Client } from 'discord.js';

export function loginBot(client: Client) {
  void client.login(ENV.BOT_DISCORD_TOKEN);
}
