import * as fs from "fs";
import { IncomingMessage } from "http";
import * as https from "https";
import * as os from "os";
import * as path from "path";

export { Api, Context, type RawApi, type Transformer } from "grammy";
export { type File } from "grammy/types";

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

// Streams the repsonse body of a URL
export async function* streamFile(url: string) {
    const response = await new Promise<IncomingMessage>(
        (resolve, reject) => {
            https
                .get(url, resolve)
                .on("error", reject);
        },
    );

    for await (const chunk of response) {
        yield new Uint8Array(chunk);
    }
}
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
