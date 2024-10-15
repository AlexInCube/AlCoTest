import { clientIntents } from './ClientIntents.js';
import { Client, Partials } from 'discord.js';
import { loggerError, loggerSend } from './utilities/logger.js';
import { loginBot } from './utilities/loginBot.js';
import { AudioPlayersManager } from './audioplayer/AudioPlayersManager.js';
import loadLocale from './locales/Locale.js';
import { handlersLoad } from './handlersLoad.js';

loggerSend(`Starting bot on version ${process.env.npm_package_version}`);

await loadLocale();

const client = new Client<true>({
  intents: clientIntents,
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.rest.on('rateLimited', (args) => {
  loggerError(`Client encountered a rate limit: ${JSON.stringify(args)}`);
});

new AudioPlayersManager(client);

await handlersLoad(client);

loginBot(client);

process.on('uncaughtException', (err) => {
  loggerError(err);
});
