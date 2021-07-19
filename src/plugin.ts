import { File, Context, Api, RawApi, Transformer } from './deps.deno.ts'
import { FileX, installFileMethods } from './files.ts'

/**
 * Transformative API Flavor that adds file handling utilities to the supplied
 * context object. Check out the
 * [documentation](https://grammy.dev/guide/context.html#transformative-context-flavours)
 * about this kind of context flavor.
 */
export type FileFlavor<C extends Context> = ContextX<C> & C
export type FileApiFlavor<A extends Api> = ApiX<A> & A

/**
 * Mapping table from method names to API call result extensions.
 *
 * In other words, every key K of this interface identifies a method of the Bot
 * API that exists as method on `ctx`, `ctx.api`, and `ctx.api.raw`. The return
 * type of every one of these three methods will be augmented by `X[K]` via type
 * intersection.
 */
interface X {
    getFile: FileX
}

/**
 * Options to pass to the files plugin. They are mainly useful if you are
 * working with a local Bot API server, and you need to adjust from where to
 * download files.
 */
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

/**
 * Plugin that hydrates results to `getFile`, and equips the results with
 * methods to download files, or get their URL/path.
 *
 * This plugin is an [API transformer
 * function](https://grammy.dev/advanced/transformers.html) that can be
 * installed on `bot.api`.
 *
 * ```ts
 * bot.api.config.use(hydrateFiles(bot.token))
 * ```
 *
 * Check out [the official plugin
 * documentation](https://grammy.dev/plugins/files.html) on the grammY webiste.
 *
 * @param token bot token, use `bot.token`
 * @param options optional configuration
 */
export function hydrateFiles<R extends RawApi = RawApi>(
    token: string,
    options?: FilesPluginOptions
): Transformer<R> {
    const root = options?.apiRoot ?? 'https://api.telegram.org'
    const buildFileUrl =
        options?.buildFileUrl ??
        ((root, token, path) => `${root}/file/bot${token}/${path}`)
    const buildLink = (path: string) => buildFileUrl(root, token, path)
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

// Helper types to add `X` to `Context` and `Api` and `RawApi`
type ContextX<C extends Context> = AddX<C> & {
    api: ApiX<C['api']>
}
type ApiX<A extends Api> = AddX<A> & {
    raw: RawApiX<A['raw']>
}
type RawApiX<R extends RawApi> = AddX<R>

type AddX<Q extends Record<keyof X, (...args: any[]) => any>> = {
    [K in keyof X]: Extend<Q[K], X[K]>
}
type Extend<F extends (...args: any[]) => any, X> = (
    ...args: Parameters<F>
) => Promise<Await<ReturnType<F>> & X>
type Await<T> = T extends PromiseLike<infer V> ? Await<V> : T
