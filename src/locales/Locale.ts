import i18next from 'i18next';
import FsBackend, { FsBackendOptions }from 'i18next-fs-backend';
import {join} from "path";
import {loggerSend} from "../utilities/logger.js";
import getDirName from "../utilities/getDirName.js";
import {ENV} from "../EnvironmentTypes.js";

export const loggerLocalization = "Localization"
export default async function loadLocale() {
    loggerSend(`Loading language "${ENV.BOT_LANGUAGE}"`, loggerLocalization)

    await i18next.use(FsBackend).init<FsBackendOptions>({
        //debug: true,
        lng: ENV.BOT_LANGUAGE,
        fallbackLng: 'en',
        ns: ["mongodb", "commandshandlers", "commands", "commandsGroups", "general", "permissions", "audioplayer"],
        backend: {
            loadPath: join(getDirName(import.meta.url), '../locales/{{lng}}/{{ns}}.json')
        }
    })

    loggerSend(`Language "${ENV.BOT_LANGUAGE}" is loaded`, loggerLocalization)
}
