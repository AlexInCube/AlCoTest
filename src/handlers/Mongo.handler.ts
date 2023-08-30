import mongoose from "mongoose";
import {loggerError, loggerSend} from "../utilities/logger.js";
import {ENV} from "../EnvironmentVariables.js";

export const loggerPrefixMongo = "MongoDB"

const handler = () => {
    const MONGO_URI = ENV.MONGO_URI
    mongoose.set("strictQuery", true);
    mongoose.pluralize(null)
    mongoose.connect(`${MONGO_URI}/${ENV.MONGO_DATABASE_NAME}`)
        .then(() => loggerSend("Connection was successful", loggerPrefixMongo))
        .catch((reason) => loggerError(`Connection error while connecting: \n` + reason, loggerPrefixMongo))
}

export default handler

export function MongoCheckConnection(){
    if (mongoose.connection.readyState === 0) {
        loggerSend("Connection is not established", loggerPrefixMongo)
        return false
    }
    return true
}

