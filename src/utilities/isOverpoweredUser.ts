import { ENV } from '../EnvironmentVariables.js';

export function isOverpoweredUser(userId: string): boolean {
  return userId === ENV.BOT_DISCORD_OVERPOWERED_ID;
}
