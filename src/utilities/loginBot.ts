import {client} from "../main";

export function loginBot(){
    void client.login(process.env.BOT_DISCORD_TOKEN)
}