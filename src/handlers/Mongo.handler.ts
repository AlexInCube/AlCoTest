import mongoose from "mongoose";
import {loggerError, loggerSend} from "../utilities/logger.js";
import i18next from "i18next";
import {ENV} from "../EnvironmentTypes.js";

export const loggerPrefixMongo = "MongoDB"

const handler = () => {
    const MONGO_URI = ENV.MONGO_URI
    mongoose.set("strictQuery", true);
    mongoose.pluralize(null)
    mongoose.connect(`${MONGO_URI}/${ENV.MONGO_DATABASE_NAME}`, {keepAlive: true})
        .then(() => loggerSend(i18next.t("mongodb:is_connected"), loggerPrefixMongo))
        .catch((reason) => loggerError(`${i18next.t('mongodb:is_connection_error')}: \n` + reason, loggerPrefixMongo))
}

export default handler

export function MongoCheckConnection(){
    if (mongoose.connection.readyState === 0) {
        loggerSend(i18next.t("mongodb:no_connection"), loggerPrefixMongo)
        return false
    }
    return true
}

