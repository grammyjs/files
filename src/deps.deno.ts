export {
    Api,
    Context,
    type RawApi,
    type Transformer,
} from "@grammyjs/grammy";
export type { File } from "@grammyjs/grammy/types";

// Determine whether a file path is absolute
export { isAbsolute as isAbsolutePath } from "node:path";

let id = 0, tempDir: string, fs: typeof import("node:fs");
export async function createTempFile() {
    if ("Deno" in globalThis) {
        tempDir ??= await Deno.makeTempDir({ prefix: "grammY" });
    } else {
        fs ??= process.getBuiltinModule("fs");
        tempDir ??= await fs.promises.mkdtemp(
            `${process.getBuiltinModule("os").tmpdir()}/grammY`,
        );
    }
    return `${tempDir}/${id++}`;
}
// Perform a request and returns the raw body
export async function fetchFile(url: string) {
    const { body } = await fetch(url);
    if (body === null) throw new Error("Download failed, no response body!");
    return body;
}
export async function* readFile(path: string): AsyncIterable<Uint8Array> {
    if ("Deno" in globalThis) {
        const file = await Deno.open(path);
        yield* file.readable;
    } else {
        fs ??= process.getBuiltinModule("fs");
        yield* fs.createReadStream(path);
    }
}
export async function copyFile(src: string, dest: string) {
    if ("Deno" in globalThis) {
        await Deno.copyFile(src, dest);
    } else {
        fs ??= process.getBuiltinModule("fs");
        await fs.promises.copyFile(src, dest);
    }
}
// Copy a file from a URL to a file path
export async function downloadFile(url: string, dest: string) {
    const body = await fetchFile(url);
    if ("Deno" in globalThis) {
        await Deno.writeFile(dest, body);
    } else {
        fs ??= process.getBuiltinModule("fs");
        await fs.promises.writeFile(dest, body);
    }
}
