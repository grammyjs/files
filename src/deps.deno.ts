export {
    Api,
    Context,
    type RawApi,
    type Transformer,
} from "https://lib.deno.dev/x/grammy@v1/mod.ts";
export type { File } from "https://lib.deno.dev/x/grammy@v1/types.ts";

// Determine whether a file path is absolute
export { isAbsolute as isAbsolutePath } from "https://deno.land/std@0.135.0/path/mod.ts";
// Create a temporary file, and copy a local file to a file path
export const { makeTempFile: createTempFile, copyFile } = Deno;
// Copy a file from a URL to a file path
export async function downloadFile(url: string, dest: string) {
    const { body } = await fetch(url);
    if (body === null) throw new Error("Download failed, no response body!");
    using writer = await Deno.open(dest, { createNew: true, write: true });
    await body.pipeTo(writer.writable);
}
