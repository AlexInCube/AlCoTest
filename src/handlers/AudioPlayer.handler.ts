import { Client } from 'discord.js';
import { AudioPlayersManager } from '../audioplayer/AudioPlayersManager.js';
import { loggerSend } from '../utilities/logger.js';

export const loggerPrefixAudioplayerHandler = 'Audioplayer Loader';

const handler = async (client: Client) => {
  loggerSend('Loading audioplayer', loggerPrefixAudioplayerHandler);
  new AudioPlayersManager(client);
};

export default handler;
