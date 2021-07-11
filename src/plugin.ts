import {
    File,
    Context,
    Api,
    RawApi,
    Middleware,
    Transformer,
} from './deps.deno.ts'
import { FileX, installFileMethods } from './files.ts'

export type FileFlavor<C extends Context> = Omit<C, 'api' | 'getFile'> & {
    api: FileApiFlavor<C['api']>
    getFile: () => ReturnType<C['getFile']> & Promise<FileX>
}
export type FileApiFlavor<A extends Api> = Omit<A, 'raw' | 'getFile'> & {
    raw: FileRawApiFlavor<A['raw']>
    getFile: (
        ...args: Parameters<A['getFile']>
    ) => ReturnType<A['getFile']> & Promise<FileX>
}
type FileRawApiFlavor<R extends RawApi> = Omit<R, 'getFile'> & {
    getFile: (
        ...args: Parameters<RawApi['getFile']>
    ) => ReturnType<R['getFile']> & Promise<FileX>
}

export interface FilesPluginOptions {
    /**
     * Root URL of the Telegram Bot API server. Used when downloading files.
     * Should be the same as for your bot object. Default:
     * https://api.telegram.org
     */
    apiRoot?: string
    /**
     * URL builder function for downloading files. Can be used to modify which
     * API server should be called when downloading files.
     *
     * @param root The URL that was passed in `apiRoot`, or its default value
     * @param token The bot's token that was passed when installing the plugin
     * @param path The `file_path` value that identifies the file
     * @returns The URL that will be fetched during the download
     */
    buildFileUrl?: (root: string, token: string, path: string) => string
}

const DEFAULT_OPTIONS: Required<FilesPluginOptions> = {
    apiRoot: 'https://api.telegram.org',
    buildFileUrl: (root, token, path) => `${root}/file/bot${token}/${path}`,
}

export function hydrate<C extends Context>(
    token: string,
    options?: FilesPluginOptions
): Middleware<FileFlavor<C>> {
    const hydrator = hydrateApi(token, { ...DEFAULT_OPTIONS, ...options })
    return (ctx, next) => {
        ctx.api.config.use(hydrator)
        return next()
    }
}

export function hydrateApi<R extends RawApi = RawApi>(
    token: string,
    options: Required<FilesPluginOptions>
): Transformer<R> {
    const buildLink = (path: string) =>
        options.buildFileUrl(options.apiRoot, token, path)
    const t: Transformer = async (prev, method, payload) => {
        const res = await prev(method, payload)
        if (res.ok && isFile(res.result))
            installFileMethods(res.result, buildLink)
        return res
    }
    return t
}

function isFile(val: unknown): val is File {
    return typeof val === 'object' && val !== null && 'file_id' in val
}
