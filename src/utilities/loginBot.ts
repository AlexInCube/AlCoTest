import {client} from "../main.js";
import {ENV} from "../EnvironmentTypes.js";

export function loginBot(){
    void client.login(ENV.BOT_DISCORD_TOKEN)
}
