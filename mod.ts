import { Formatter } from "./src/fmt.ts";
import { Options } from "./src/options.ts";

export { default as defaultOptions } from "./src/options.ts";
export { Formatter, Options };

interface DefaultFormatter extends Formatter {
  Formatter: typeof Formatter;
  Options: typeof Options;
}

export const fmt: DefaultFormatter = await Formatter.init({
  type: typeof Deno.Command === "function" ? "cli" : "wasm",
}) as DefaultFormatter;

// for the default export, and backwards compatibility
fmt.Formatter = Formatter;
fmt.Options = Options;

export const format: typeof fmt.format = fmt.format;
export const formatSync: typeof fmt.formatSync = fmt.formatSync;
export const check: typeof fmt.check = fmt.check;
export const checkSync: typeof fmt.checkSync = fmt.checkSync;

export default fmt;
