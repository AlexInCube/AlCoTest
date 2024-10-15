import path from 'path';
import fs from 'fs';
import { loggerError, loggerSend } from './utilities/logger.js';
import { z } from 'zod';

const loggerPrefixLava = 'Lavalink';

const lavaNodesFileName = `lavanodes.json`;
const lavaNodesPath = path.resolve(process.cwd(), lavaNodesFileName);

if (fs.existsSync(lavaNodesPath)) {
  loggerSend(`LavaNodes is found in ${lavaNodesPath}`, loggerPrefixLava);
} else {
  loggerError(`${lavaNodesFileName} not found`, loggerPrefixLava);
  process.exit(1);
}

const lavaNodesFile = JSON.parse(fs.readFileSync(lavaNodesPath, { encoding: 'utf8', flag: 'r' }));

const lavaNodesSchema = z.array(
  z.object({
    host: z.string(),
    port: z.number(),
    password: z.string(),
    secure: z.boolean()
  })
);

export const LavaNodes = lavaNodesSchema.parse(lavaNodesFile);
