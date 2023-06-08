import {fileURLToPath} from "url";
import path from "path";

export default function getDirName(meta_url: string){
    const __filename = fileURLToPath(meta_url);

    return path.dirname(__filename);
}
