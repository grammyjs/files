// deno-lint-ignore-file no-explicit-any
import { Api, Context, File, RawApi, Transformer } from "./deps.deno.ts";
import { FileX, getFileMethods } from "./files.ts";

/**
 * Transformative API Flavor that adds file handling utilities to the supplied
 * context object. Check out the
 * [documentation](https://grammy.dev/guide/context.html#transformative-context-flavours)
 * about this kind of context flavor.
 */
export type FileFlavor<C extends Context> = ContextX<C> & C;
export type FileApiFlavor<A extends Api> = ApiX<A> & A;

/**
 * Mapping table from method names to API call result extensions.
 *
 * In other words, every key K of this interface identifies a method of the Bot
 * API that exists as method on `ctx`, `ctx.api`, and `ctx.api.raw`. The return
 * type of every one of these three methods will be augmented by `X[K]` via type
 * intersection.
 */
interface X {
    getFile: FileX;
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
    apiRoot?: string;
    /**
     * Specifies whether to use the [test
     * environment](https://core.telegram.org/bots/webapps#using-bots-in-the-test-environment).
     * Can be either `"prod"` (default) or `"test"`.
     *
     * The testing infrastructure is separate from the regular production
     * infrastructure. No chats, accounts, or other data is shared between them.
     * If you set this option to `"test"`, you will need to make your Telegram
     * client connect to the testing data centers of Telegram, register your
     * phone number again, open a new chat with @BotFather, and create a
     * separate bot.
     */
    environment?: "prod" | "test";
    /**
     * URL builder function for downloading files. Can be used to modify which
     * API server should be called when downloading files.
     *
     * @param root The URL that was passed in `apiRoot`, or its default value
     * @param token The bot's token that was passed when installing the plugin
     * @param path The `file_path` value that identifies the file
     * @param env The value that was passed in `environment`, or its default value
     * @returns The URL that will be fetched during the download
     */
    buildFileUrl?: (
        root: string,
        token: string,
        path: string,
        env: "prod" | "test",
    ) => string | URL;
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
 * documentation](https://grammy.dev/plugins/files.html) on the grammY website.
 *
 * @param token bot token, use `bot.token`
 * @param options optional configuration
 */
export function hydrateFiles<R extends RawApi = RawApi>(
    token: string,
    options?: FilesPluginOptions,
): Transformer<R> {
    const root = options?.apiRoot ?? "https://api.telegram.org";
    const environment = options?.environment ?? "prod";
    const buildFileUrl = options?.buildFileUrl ?? defaultBuildFileUrl;
    const buildLink = (path: string) =>
        buildFileUrl(root, token, path, environment);
    const methods = getFileMethods(buildLink);
    const t: Transformer = async (prev, method, payload, signal) => {
        const res = await prev(method, payload, signal);
        if (res.ok && isFile(res.result)) {
            Object.assign(res.result, methods);
        }
        return res;
    };
    return t;
}

const defaultBuildFileUrl: NonNullable<FilesPluginOptions["buildFileUrl"]> = (
    root,
    token,
    method,
    env,
) => {
    const prefix = env === "test" ? "test/" : "";
    return `${root}/file/bot${token}/${prefix}${method}`;
};

function isFile(val: unknown): val is File {
    return typeof val === "object" && val !== null && "file_id" in val;
}

// Helper types to add `X` to `Context` and `Api` and `RawApi`
type ContextX<C extends Context> = AddX<C> & {
    api: ApiX<C["api"]>;
};
type ApiX<A extends Api> = AddX<A> & {
    raw: RawApiX<A["raw"]>;
};
type RawApiX<R extends RawApi> = AddX<R>;

type AddX<Q extends Record<keyof X, (...args: any[]) => any>> = {
    [K in keyof X]: Extend<Q[K], X[K]>;
};
type Extend<F extends (...args: any[]) => any, X> = (
    ...args: Parameters<F>
) => Promise<Await<ReturnType<F>> & X>;
type Await<T> = T extends PromiseLike<infer V> ? Await<V> : T;
