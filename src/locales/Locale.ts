import i18next from 'i18next';
import FsBackend, { FsBackendOptions }from 'i18next-fs-backend';
import {join} from "path";
import {loggerSend} from "../utilities/logger.js";
import getDirName from "../utilities/getDirName.js";

export const loggerLocalization = "Localization"
export async function load() {
    await i18next.use(FsBackend).init<FsBackendOptions>({
        //debug: true,
        lng: process.env.BOT_LANGUAGE,
        fallbackLng: 'en',
        ns: ["logger", "mongodb"],
        backend: {
            loadPath: join(getDirName(import.meta.url), '../locales/{{lng}}/{{ns}}.json')
        }
    })

    loggerSend(`Language "${process.env.BOT_LANGUAGE}" is loaded`, loggerLocalization)
}
