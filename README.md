# File handling simplified in grammY

This plugin allows you to easily download files from Telegram servers.
Check out [the official plugin page](https://grammy.dev/plugins/files.html) for further documentation.

## Example

```ts
import { Bot, Context } from "grammy";
import { FileFlavor, hydrateFiles } from "@grammyjs/files";

// Transformative API flavor
type MyContext = FileFlavor<Context>;

// Create bot
const bot = new Bot<MyContext>("");

// Install plugin
bot.api.config.use(hydrateFiles(bot.token));

// Download videos and GIFs to temporary files
bot.on([":video", ":animation"], async (ctx) => {
    // Prepare file for download
    const file = await ctx.getFile();
    // Download file to temporary location on your disk
    const path = await file.download();
    // Print file path
    console.log("File saved at", path);
});
```

You can pass a string with a file path to `download` if you don't want to create a temporary file.
Just do `await file.download('/path/to/file')`.
