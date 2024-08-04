import { clientIntents } from './ClientIntents.js';

loggerSend(`Starting bot on version ${process.env.npm_package_version}`);

import { Client, Partials } from 'discord.js';
import { loggerError, loggerSend } from './utilities/logger.js';
import { loginBot } from './utilities/loginBot.js';
import { AudioPlayerCore } from './audioplayer/AudioPlayerCore.js';
import loadLocale from './locales/Locale.js';

await loadLocale();

import { handlersLoad } from './handlersLoad.js';

const client = new Client<true>({
  intents: clientIntents,
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.rest.on('rateLimited', (args) => {
  loggerError(`Client encountered a rate limit: ${JSON.stringify(args)}`);
});

new AudioPlayerCore(client);

await handlersLoad(client);

loginBot(client);

process.on('uncaughtException', (err) => {
  loggerError(err);
});
