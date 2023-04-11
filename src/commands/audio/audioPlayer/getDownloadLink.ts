import {client} from "../../../main";
import {SearchResultType} from "distube";

export async function getDownloadLink(request: string) {
    let songUrl = "undefined"

    if (!request.startsWith("https://www.youtube.com") && !request.startsWith("www.youtube.com")) {
        await client.audioPlayer.distube.search(request, {
            limit: 1,
            type: SearchResultType.VIDEO
        }).then(function (result) {
            songUrl = result[0].url
        })
    } else {
        songUrl = request
    }

    songUrl = songUrl.replace("youtube.com/", "youtube5s.com/")

    return songUrl
}