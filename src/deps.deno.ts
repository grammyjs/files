import {
    readerFromIterable,
    copy,
} from 'https://deno.land/std@0.101.0/io/mod.ts'

export { Api, Context } from 'https://deno.land/x/grammy@v1.3.0/mod.ts'
export type {
    Transformer,
    RawApi,
    Middleware,
} from 'https://deno.land/x/grammy@v1.3.0/mod.ts'
export type { File } from 'https://cdn.skypack.dev/@grammyjs/types@v2.2.2?dts'

// Determine whether a file path is absolute
export { isAbsolute as isAbsolutePath } from 'https://deno.land/std@0.101.0/path/mod.ts'
// Create a temporary file
export const createTempFile = () => Deno.makeTempFile()
// Copy a local file to a file path
export const copyFile = Deno.copyFile
// Copy a file from a URL to a file path
export const downloadFile = async (url: string, dest: string) => {
    const { body } = await fetch(url)
    if (body === null) throw new Error('Download failed, no response body!')
    const reader = readerFromIterable(body)
    const writer = await Deno.open(dest, { createNew: true, write: true })
    try {
        await copy(reader, writer)
    } finally {
        writer.close()
    }
}
