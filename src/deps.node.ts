import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import * as https from "https";

export { Api, Context, RawApi, Transformer } from "grammy";
export { File } from "@grammyjs/types";

// Determine whether a file path is absolute
export { isAbsolute as isAbsolutePath } from "path";
// Create a temporary file
export const createTempFile = async () =>
    path.join(
        await fs.promises.mkdtemp(
            (await fs.promises.realpath(os.tmpdir())) + path.sep,
        ),
        "filedata",
    );
// Copy a local file to a file path
export const copyFile = fs.promises.copyFile;
// Copy a file from a URL to a file path
export function downloadFile(url: string, dest: string) {
    const file = fs.createWriteStream(dest);
    return new Promise<void>((resolve, reject) => {
        https.get(url, (res) => {
            res.pipe(file);
            file.on("finish", () => {
                file.close();
                resolve();
            });
        }).on(
            "error",
            (err0) => fs.unlink(dest, (err1) => reject(err1 ? err1 : err0)),
        );
    });
}
