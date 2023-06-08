import {client} from "../main.js";

export function loginBot(){
    void client.login(process.env.BOT_DISCORD_TOKEN)
}
