import {Client} from "discord.js";

export async function getDownloadLink(client: Client, request: string): Promise<string | undefined> {
    for (const plugin of client.audioPlayer.distube.customPlugins) {
        if (await plugin.validate(request)) {
            return plugin.getStreamURL(request);
        }
    }

    for (const plugin of client.audioPlayer.distube.extractorPlugins) {
        if (await plugin.validate(request)) {
            return plugin.getStreamURL(request);
        }
    }

    return undefined
}
