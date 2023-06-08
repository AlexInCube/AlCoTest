import mongoose from "mongoose";
import {loggerSend} from "../utilities/logger.js";
import i18next from "i18next";

export const loggerPrefixMongo = "MongoDB"

const handler = () => {
    const MONGO_URI = process.env.MONGO_URI
    mongoose.set("strictQuery", true);
    mongoose.pluralize(null)
    mongoose.connect(`${MONGO_URI}/${process.env.MONGO_DATABASE_NAME}`, {keepAlive: true})
        .then(() => loggerSend(i18next.t("mongodb:mongodb_is_connected"), loggerPrefixMongo))
        .catch((reason) => loggerSend(`Ошибка при установке соединения: \n` + reason, loggerPrefixMongo))
}

export default handler

export function MongoCheckConnection(){
    if (mongoose.connection.readyState === 0) {
        loggerSend(`Соединение с базой данных не установлено`, loggerPrefixMongo)
        return false
    }
    return true
}

