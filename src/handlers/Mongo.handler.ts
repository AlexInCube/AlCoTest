import mongoose from 'mongoose';
import { loggerError, loggerSend } from '../utilities/logger.js';
import { ENV } from '../EnvironmentVariables.js';

export const loggerPrefixMongo = 'MongoDB';

export default async function mongoHandler() {
  const MONGO_URI = ENV.MONGO_URI;
  mongoose.set('strictQuery', true);
  mongoose.pluralize(null);

  try {
    await mongoose.connect(`${MONGO_URI}/${ENV.MONGO_DATABASE_NAME}`);
    loggerSend('Connection was successful', loggerPrefixMongo);
  } catch (error) {
    loggerError(`Connection error while connecting: \n` + error, loggerPrefixMongo);
    throw error;
  }
}

export function MongoCheckConnection() {
  if (mongoose.connection.readyState === 0) {
    loggerSend('Connection is not established', loggerPrefixMongo);
    return false;
  }
  return true;
}
