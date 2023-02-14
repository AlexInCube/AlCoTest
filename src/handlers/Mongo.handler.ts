import mongoose from "mongoose";
import {loggerSend} from "../utilities/logger";

export const loggerPrefixMongo = "[ MongoDB ] "

const handler = () => {
    const MONGO_URI = process.env.MONGO_URI
    if (!MONGO_URI) return loggerSend(`${loggerPrefixMongo}URI не найдено в .env`)
    mongoose.set("strictQuery", true);
    mongoose.pluralize(null)
    mongoose.connect(`${MONGO_URI}/${process.env.MONGO_DATABASE_NAME}`, {keepAlive: true})
        .then(() => loggerSend(`${loggerPrefixMongo}Соединение было установлено`))
        .catch((reason) => loggerSend(`${loggerPrefixMongo}Ошибка при установке соединения: \n` + reason))
}

export default handler

export function MongoCheckConnection(){
    if (mongoose.connection.readyState === 0) {
        loggerSend(`${loggerPrefixMongo}Соединение с базой данных не установлено`)
        return false
    }
    return true
}

