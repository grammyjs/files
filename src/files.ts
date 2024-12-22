import {
    copyFile,
    createTempFile,
    downloadFile,
    fetchFile,
    File,
    isAbsolutePath,
    readFile,
} from "./deps.deno.ts";

export interface FileX {
    /** Computes a URL from the `file_path` property of this file object. The
     * URL can be used to download the file contents.
     *
     * If you are using a local Bot API server, then this method will return the
     * file path that identifies the local file on your system.
     *
     * If the `file_path` of this file object is `undefined`, this method will
     * throw an error.
     *
     * Note that this method is installed by grammY on [the File
     * object](https://core.telegram.org/bots/api#file).
     */
    getUrl(): string;
    /**
     * This method will download the file from the Telegram servers and store it
     * under the given file path on your system. It returns the absolute path to
     * the created file, so this may be the same value as the argument to the
     * function.
     *
     * If you omit the path argument to this function, then a temporary file
     * will be created for you. This path will still be returned, hence giving
     * you access to the downloaded file.
     *
     * If you are using a local Bot API server, then the local file will be
     * copied over to the specified path, or to a new temporary location.
     *
     * If the `file_path` of this file object is `undefined`, this method will
     * throw an error.
     *
     * Note that this method is installed by grammY on [the File
     * object](https://core.telegram.org/bots/api#file).
     *
     * @param path Optional path to store the file (default: temporary file)
     * @returns An absolute file path to the downloaded/copied file
     */
    download(path?: string): Promise<string>;
    /**
     * This method will fetch the file URL and return an async iterator which
     * yields every time a new chunk of data is read.
     *
     * If the `file_path` of this file object is `undefined`, this method will
     * throw an error.
     *
     * @example
     * ```ts
     *  bot.on([":video", ":animation"], async (ctx) => {
     *      // Prepare file for download
     *      const file = await ctx.getFile();
     *      // Print the size of each chunk
     *      for await (const chunk of file) {
     *        console.log(`Read ${chunk.length} bytes`);
     *      }
     *  });
     * ```
     *
     * @returns Async iterator for the received data
     */
    [Symbol.asyncIterator](): AsyncIterator<Uint8Array>;
}

export function getFileMethods(
    linkBuilder: (path: string) => string | URL,
) {
    const methods: FileX = {
        getUrl(this: File) {
            const path = this.file_path;
            if (path === undefined) {
                const id = this.file_id;
                throw new Error(`File path is not available for file '${id}'`);
            }
            if (isAbsolutePath(path)) return path;
            const link = linkBuilder(path);
            if (link instanceof URL) return link.href;
            return link;
        },
        async download(path?: string) {
            const url = this.getUrl();
            path ??= await createTempFile();
            if (isAbsolutePath(url)) await copyFile(url, path);
            else await downloadFile(url, path);
            return path;
        },
        async *[Symbol.asyncIterator]() {
            const url = this.getUrl();
            if (isAbsolutePath(url)) {
                yield* readFile(url);
            } else {
                yield* await fetchFile(url);
            }
        },
    };
    return methods;
}
