/// <reference lib="deno.unstable" />
/// <reference lib="deno.window" />

// deno-lint-ignore-file no-namespace

/*!
 * This is a bundled version of the third-party `deno_fmt` module (not
 * to be confused with the built-in `fmt` module). The original source
 * code can be found at the GitHub Repository or on deno.land/x:
 *  - https://github.com/nberlette/deno_fmt#readme
 *  - https://deno.land/x/deno_fmt/mod.ts?source
 * ------------------------------------------------------------------
 * Copyright (c) 2024 Nicholas Berlette. All rights reserved.
 * Licensed under the MIT License. See LICENSE for more information.
 */
import { CommandContext, Context, WasmContext } from "./context.ts";
import { bindSafe } from "./helpers.ts";
import { IOptions, Options } from "./options.ts";
import type { LRU } from "./lru.ts";
import type { InspectOptions, InspectOptionsStylized } from "node:util";

export type Language =
  | "typescript"
  | "json"
  | "markdown"
  | "toml"
  | "dockerfile";

export interface CacheConfig {
  capacity?: number;
  ttl?: number;
  ondispose?: (this: LRU<string>) => void;
  onrefresh?: (
    this: LRU<string>,
    key: string,
    value?: string,
    time?: number,
  ) => void;
  onremove?: (
    this: LRU<string>,
    key: string,
    value?: string,
    time?: number,
  ) => void;
}

export interface Config {
  type?: "cli" | "wasm";
  cleanup?: boolean | ((this: Formatter, tmp: string) => void);
  cache?: boolean | CacheConfig;
  options?: IOptions;
}

export namespace Config {
  export type Resolved = {
    readonly type: "cli";
    cleanup(this: Formatter, tmp?: string): void;
    cache: Required<CacheConfig>;
    options: Options;
  } | {
    readonly type: "wasm";
    cleanup(this: Formatter): void;
    cache: Required<CacheConfig>;
    options: Options;
  };
}

/**
 * # deno_fmt
 *
 * The `deno_fmt` module provides a high-level API for formatting and checking
 * source code, running on the `deno fmt` shell command and `dprint` WASM API.
 * Both implementations are supported and can be used interchangeably depending
 * on the environment the formatter is running in.
 *
 * ## Usage
 *
 * ### Deno CLI
 *
 * For those using the Deno CLI or other environments with access to the
 * `Deno.Command` API, the `deno fmt` shell command is the default formatter.
 *
 * ```ts
 * import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";
 *
 * const fmt = await Formatter.initLegacy();
 *
 * await fmt.format("const foo = {bar: 'baz'}");
 * // => const foo = { bar: "baz" };\n
 *
 * fmt.formatSync("const foo = {bar: 'baz'}", { check: true });
 * // => false
 * ```
 *
 * ### WASM
 *
 * For those using Deno Deploy or other environments without access to the
 * `Deno.Command` API and the `allow-run` permission flag, the `dprint` WASM
 * API is the default formatter.
 *
 * ```ts
 * import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";
 * const fmt = await Formatter.init();
 *
 * await fmt.format("const a={b:'c'}"); // => const a = { b: "c" };\n
 * fmt.checkSync("const foo = {bar: 'baz'}"); // => false
 * ```
 *
 * ---
 *
 * # API
 *
 * ## `Formatter`
 *
 * The `Formatter` class is the main entry point for the `deno_fmt` module. It
 * provides a high-level API for formatting and checking source code, running on
 * the `deno fmt` shell command and `dprint` WASM API. You can instantiate a new
 * `Formatter` instance using the static method `Formatter.init` (WASM), or
 * `Formatter.initLegacy` (CLI). You can also use the synchronous `initSync` and
 * `initLegacySync` methods if you absolutely **must** use a synchronous API.
 *
 * ### Static Method: `Formatter.init`
 *
 * Asynchronously initializes a new `Formatter` instance using the dprint WASM
 * formatting context, and with the specified configuration options. If no
 * options are provided, the default options will be used.
 *
 * ```ts
 * import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";
 *
 * const fmt = await Formatter.init();
 *
 * const fmtCustom = await Formatter.init({
 *   ext: "md", // targets markdown files by default
 *   lineWidth: 100, // sets the line width to 100 characters
 * });
 * ```
 *
 * #### Static Method: `Formatter.initLegacy(options?: Options)`
 *
 * Asyncronously initializes a new `Formatter` instance using the CLI formatting
 * context, and with the specified configuration options. If no options are
 * provided, the default options will be used.
 *
 * ```ts
 * import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";
 *
 * // initialize the Deno CLI context with the default options:
 * const fmt = await Formatter.initLegacy();
 *
 * // initialize the Deno CLI context with custom options:
 * const fmtCustom = await Formatter.initLegacy({
 *   singleQuote: true, // uses single quotes instead of double quotes
 *   useTabs: true, // uses tabs instead of spaces
 * });
 * ```
 *
 * #### Static Method: `Formatter.initSync(options?: Options)`
 *
 * Synchronously initializes a new `Formatter` instance using the dprint WASM
 * formatting context, and with the specified configuration options. If no
 * options are provided, the default options will be used. This method is not
 * recommended for use unless you absolutely **must** use a synchronous API.
 * Instead, it's recommended that you instantiate the formatter asynchronously
 * at the top level of your program, since ES modules are asynchronous by their
 * very nature, and top-level `await` is supported in Deno.
 *
 * ```ts
 * import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";
 *
 * // initialize the WASM context with default options:
 * const fmt = Formatter.initSync();
 *
 * // initialize the WASM context with custom options:
 * const fmtCustom = Formatter.initSync({
 *   ext: "jsonc", // targets jsonc files by default
 *   lineWidth: 120, // sets the line width to 120 characters
 * });
 * ```
 *
 * #### Static Method: `Formatter.initLegacySync(options?: Options)`
 *
 * Synchronously initializes a new `Formatter` instance using the CLI formatting
 * context, with the specified configuration options. If no options are given,
 * the default options will be used. This method is not recommended for use
 * unless you absolutely **must** use a synchronous API. Instead, you should
 * instantiate the formatter asynchronously at the top level of your program,
 * since ES modules are asynchronous by their very nature, and top-level `await`
 * is supported in Deno.
 *
 * ```ts
 * import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";
 *
 * // initialize with the Deno CLI context and default options:
 * const fmt = Formatter.initLegacySync();
 *
 * // initialize with the Deno CLI context and custom options:
 * const fmtCustom = Formatter.initLegacySync({
 *   ext: "tsx", // targets jsx/tsx files by default
 *   useTabs: true, // uses tabs instead of spaces
 * });
 * ```
 *
 * ### Instance Method: `format`
 *
 * Asynchronously formats the given code, returning a Promise that resolves to
 * the formatted code, or rejects with an error if it could not be formatted.
 * This is the programmatic equivalent to the `deno fmt` CLI command. You may
 * also provide an optional second argument, `overrides`, which will be merged
 * on top of the instance options prior to formatting.
 *
 * ```ts
 * import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";
 *
 * const fmt = await Formatter.init(); // initialize the formatter (WASM)
 *
 * await fmt.format(`const foo = {bar: "baz"}`);
 * // => const foo = { bar: "baz" };\n
 *
 * await fmt.format(`const foo = {bar: "baz"}`, { singleQuote: true });
 * // => const foo = { bar: 'baz' };\n
 * ```
 *
 * ### Instance Method: `formatSync`
 *
 * Synchronously formats the given code, returning the formatted code. You may
 * also provide an optional second argument, `overrides`, which will be merged
 * on top of the instance options prior to formatting.
 *
 * ```ts
 * import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";
 *
 * const fmt = await Formatter.init(); // initialize the formatter (WASM)
 *
 * fmt.formatSync(`const foo = {bar: "baz"}`);
 * // => const foo = { bar: "baz" };\n
 *
 * fmt.formatSync(`const foo = {bar: "baz"}`, { semiColons: false });
 * // => const foo = { bar: "baz" }\n
 * ```
 *
 * ### Instance Method: `check`
 *
 * Asynchronously checks if the given code is formatted, returning a Promise
 * that resolves to a boolean representing the result of the check. You may also
 * provide an optional second argument, `overrides`, which will be merged on top
 * of the instance options prior to checking. This is the programmatic equivalent
 * to `deno fmt --check` in the CLI.
 *
 * ```ts
 * import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";
 *
 * const fmt = await Formatter.init(); // initialize the formatter (WASM)
 *
 * await fmt.check(`const foo = {bar: "baz"}`);
 * // => false
 *
 * await fmt.check(`const foo = { bar: "baz" };\n`);
 * // => true
 * ```
 *
 * ### Instance Method: `checkSync`
 *
 * Synchronously checks if the given code is formatted, returning a boolean
 * representing the result of the check. You may also provide an optional second
 * argument, `overrides`, which will be merged on top of the instance options
 * prior to checking. This is the programmatic equivalent to `deno fmt --check`.
 *
 * ```ts
 * import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";
 *
 * const fmt = await Formatter.init(); // initialize the formatter (WASM)
 *
 * fmt.checkSync(`const foo = {bar: "baz"}`);
 * // => false
 *
 * fmt.checkSync(`const foo = { bar: "baz" };\n`);
 * // => true
 *
 * fmt.checkSync(`const foo = { bar: "baz" }\n`, { semiColons: false });
 * // => true
 * ```
 *
 * ---
 *
 * ### Performance Considerations
 *
 * There are performance trade-offs between the two available context types.
 *
 * #### WASM
 *
 * If you're using the WASM formatting engine, you may notice a slight delay on
 * initial load, due to the time it takes to instantiate the WASM binary (quite
 * a large file). Once the binary is loaded, however, the WASM implementation's
 * an **extremely** fast formatter, often clocking in speeds that are nearly as
 * fast as returning cached results from the LRU cache.
 *
 * #### CLI
 *
 * If you're using the CLI formatting engine, you might notice a much faster
 * start up time, but a slightly slower formatting time. This is due to the
 * overhead of spawning a subprocess, and the additional cost of piping data to
 * and from the spawned subprocess. However, the CLI implementation is still a
 * very fast formatter, and is often only a few milliseconds slower than the
 * WASM implementation.
 *
 * If you can afford the initial load time, the WASM implementation will likely
 * prove to be your best bet. However, if you cannot afford the initial loading
 * time, but **can** afford to spare a few milliseconds on each format, the CLI
 * implementation might be a better choice for you.
 *
 * Unfortunately, if you're running in an environment like Deno Deploy, or if
 * the `allow-run` permission is unavailable in your scenario, the CLI option
 * is not available to you -- you'll have to use the WASM implementation.
 *
 * #### Caching
 *
 * Both implementations use an LRU cache to store previously formatted code, in
 * order to avoid reformatting the same code multiple times. This cache can be
 * disabled or configured by providing a `cache` option to the constructor or
 * static initializer method of your choice.
 *
 * ---
 *
 * ## Examples
 *
 * @example
 * ```ts
 * import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";
 * const fmt = await Formatter.init(); // initialize the formatter (WASM)
 *
 * const ugly = `const foo = {bar: "baz"}`;
 *
 * // asynchronously format code (like `deno fmt`)
 * const pretty = await fmt.format(ugly);
 *
 * console.log(pretty);
 * // => const foo = { bar: "baz" };\n
 * ```
 *
 * @example
 * ```ts
 * import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";
 * const fmt = await Formatter.initLegacy(); // initialize the formatter (CLI)
 *
 * // asynchronously check if code is formatted (like `deno fmt --check`)
 * const isFormatted1 = await fmt.check(ugly);
 * const isFormatted2 = await fmt.check(pretty);
 * console.log(isFormatted1, isFormatted2); // => false, true
 * ```
 *
 * @example
 * ```ts
 * import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";
 * const fmt = await Formatter.init(); // initialize the formatter (WASM)
 *
 * // synchronously format code (like `deno fmt`)
 * const prettySync = fmt.formatSync(ugly);
 * // => const foo = { bar: "baz" };\n
 * ```
 *
 * @example
 * ```ts
 * import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";
 * const fmt = await Formatter.initLegacy(); // initialize the formatter (CLI)
 *
 * // synchronously check if code is formatted (like `deno fmt --check`)
 * const isPrettySync = fmt.checkSync(ugly, prettySync); // => false, true
 * ```
 *
 * @example
 * ```ts
 * import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";
 * const fmt = await Formatter.init(); // initialize the formatter (WASM)
 *
 * // the formatter also supports a tagged template syntax!
 * const prettySync2 = fmt.formatSync`const foo = {bar:'baz'}`;
 *
 * // ...and it's also supported for checking!
 * const isPrettySync2 = fmt.checkSync`const foo = { bar: "baz" };\n`;
 *
 * console.log(prettySync2 === prettySync, isPrettySync2); // => true, true
 * ```
 *
 * ### Bonus Combo: `deno_fmt` + `deno_emit`
 *
 * ```ts
 * import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";
 * import { bundle } from "https://deno.land/x/emit/mod.ts";
 *
 * const fmt = await Formatter.init();
 *
 * const { code } = await bundle("https://deno.land/std@0.177.1/node/util.ts");
 * const result = await fmt.format(code, { ext: "js" });
 *
 * console.log(code.length - result.length, "bytes saved!");
 * // => 51477 bytes saved!
 * ```
 */
export class Formatter implements Disposable {
  static async init(
    config: Config & { type: "cli" },
  ): Promise<Formatter.Legacy>;
  static async init(
    config?: Config & { type?: "wasm" },
  ): Promise<Formatter.Wasm>;
  static async init(config?: Config): Promise<Formatter>;
  static async init(config?: Config): Promise<Formatter> {
    const formatter = new Formatter({ type: "wasm", ...config ?? {} });
    if (formatter.context instanceof WasmContext) {
      await formatter.context.init();
    }
    return formatter;
  }

  static initSync(config: Config & { type: "cli" }): Formatter.Legacy;
  static initSync(config?: Config & { type?: "wasm" }): Formatter.Wasm;
  static initSync(config?: Config): Formatter;
  static initSync(config?: Config): Formatter {
    const formatter = new Formatter({ type: "wasm", ...config ?? {} });
    if (formatter.context instanceof WasmContext) {
      formatter.context.initSync();
    }
    return formatter;
  }

  static async initLegacy(config?: Config): Promise<Formatter.Legacy> {
    return await Formatter.init(
      { ...config, type: "cli" } as const,
    ) as Formatter.Legacy;
  }

  static initLegacySync(config?: Config): Formatter.Legacy {
    return Formatter.initSync({ ...config, type: "cli" }) as Formatter.Legacy;
  }

  #context!: Context;
  #config!: Config;

  constructor(config?: Config) {
    this.#config = config ?? {};

    const { type = "cli", cleanup, options } = this.config;

    if (type === "cli" && typeof Deno.Command === "function") {
      this.#context = new CommandContext(config);
    } else {
      this.#context = new WasmContext(config);
    }

    Object.assign(this.config, config ?? {});
    Object.assign(this.context.options, options ?? {});

    if (!cleanup) {
      this.config.cleanup = () => {};
    } else if (typeof cleanup === "function") {
      this.config.cleanup = cleanup;
    }

    this.config.cleanup &&= this.config.cleanup!.bind(this);

    this.format = bindSafe(this.format, this);
    this.formatSync = bindSafe(this.formatSync, this);
    this.check = bindSafe(this.check, this);
    this.checkSync = bindSafe(this.checkSync, this);
  }

  public get config(): Config.Resolved {
    return this.#config as Config.Resolved;
  }

  public get context(): Context {
    return this.#context ??= new (
      this.config.type === "wasm" ? WasmContext : CommandContext
    )();
  }

  public get options(): Options.Resolved {
    return this.context.options;
  }

  /**
   * Asynchronously format the given {@linkcode input}, returning the result as
   * a string. The input may be a string, an ArrayBuffer, or an ArrayBuffer
   * View like a TypedArray or DataView. SharedArrayBuffers are supported, but
   * are not recommended for use with this method, as they may be mutated by
   * other code while the formatter is running.
   *
   * @see {@linkcode formatSync} for the synchronous version of this method.
   *
   * @param {string | BufferSource} input The code to format.
   * @returns {Promise<string>} The formatted code.
   * @throws {Error} If the formatter process exits with a non-zero exit code.
   * @throws {ReferenceError} If the formatter has been disposed.
   * @throws {TypeError} If the input is not a string or BufferSource.
   *
   * @example
   * ```ts
   * import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";
   *
   * const fmt = await Formatter.init(); // wasm context
   *
   * const ugly = `const foo={bar:"baz",qux:'quux',iam:'ugly',rrrawwwr:"😡"}`;
   * const pretty = await fmt.format(ugly);
   *
   * console.log(pretty)
   * // const foo = {
   * //   bar: "baz",
   * //   qux: "quux",
   * //   iam: "ugly",
   * //   rrrawwwr: "😡",
   * // };
   * ```
   */
  public async format(input: string | BufferSource): Promise<string>;

  /**
   * Asynchronously checks if a given {@linkcode input} is formatted correctly,
   * returning a boolean representing the results of the check. Functionally
   * equivalent to the {@linkcode check} method.
   *
   * This is the programmatic equivalent of the `deno fmt --check` command.
   *
   * @see {@linkcode checkSync} for the synchronous version of this method.
   *
   * @param {string | BufferSource} input The code to check.
   * @param {Options} [overrides] The options to use for checking.
   * @returns {Promise<boolean>} `true` if it's formatted correctly, otherwise `false`.
   * @throws {Error} If the formatter process exits with a non-zero exit code.
   * @throws {ReferenceError} If the formatter has been disposed.
   * @throws {TypeError} If the input is not a string or BufferSource.
   */
  public async format(
    input: string | BufferSource,
    overrides: IOptions & { check: true },
  ): Promise<boolean>;

  /**
   * Asynchronously formats the given {@linkcode input}, returning the result
   * as a string. You may provide an optional {@linkcode overrides} object,
   * which will be merged with the existing instance {@linkcode options} prior
   * to formatting.
   *
   * This is the programmatic equivalent of the `deno fmt` command.
   *
   * @see {@linkcode formatSync} for the synchronous version of this method.
   *
   * @param {string | BufferSource} input The code to format.
   * @param {Options} [overrides] The options to use for formatting.
   * @returns {Promise<string>} The formatted code.
   * @throws {Error} If the formatter process exits with a non-zero exit code.
   * @throws {ReferenceError} If the formatter has been disposed.
   * @throws {TypeError} If the input is not a string or BufferSource.
   */
  public async format(
    input: string | BufferSource,
    overrides?: IOptions & { check?: boolean | undefined },
  ): Promise<string>;

  /**
   * Asynchronously formats the given {@link input}, which is provided as a
   * literal template string, and returns a Promise that resolves to the result
   * as a string or rejects with any error (if one was encountered). You also
   * can provide an optional {@linkcode overrides} object as the first or last
   * interpolated template value, which will be merged with the existing
   * instance {@linkcode options} prior to formatting.
   *
   * This is the programmatic equivalent of the `deno fmt` command.
   *
   * @see {@linkcode formatSync} for the synchronous version of this method.
   *
   * @param {TemplateStringsArray} input Template string array containing the target code to be formatted.
   * @param {[Options?, ...unknown[]] | [...unknown[], Options]} values The interpolated values to be parsed and used to construct the template string. If the first or the last value are an {@linkcode Options} object, it will be merged with the existing instance {@linkcode options} prior to formatting.
   * @returns {Promise<string>} The formatted code.
   * @throws {Error} If the formatter process exits with a non-zero exit code.
   * @throws {ReferenceError} If the formatter has been disposed.
   * @throws {TypeError} If the input is not a string or BufferSource.
   *
   * @example
   * ```ts
   * import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";
   *
   * const fmt = await Formatter.init(); // wasm context
   *
   * const pretty = await fmt.format`const foo={
   *   a:'1',b:"2", c : 3 }${{ lineWidth: 60, useTabs: true }}`;
   *
   * console.log(pretty);
   *
   * // const foo = {
   * //   a: "1",
   * //   b: "2",
   * //   c: 3,
   * // };
   * ```
   */
  public async format(
    input: TemplateStringsArray,
    ...values: [IOptions?, ...unknown[]] | [...unknown[], IOptions]
  ): Promise<string>;

  /**
   * Asynchronously formats the given {@link input}, which is provided either
   * as a string, BufferSource, or a template strings array. Returns a Promise
   * that resolves to the result as a string, or rejects with any error if one
   * was encountered. You also can provide an optional {@linkcode overrides}
   * object as the first or last interpolated template value, which will be
   * merged with the existing instance {@linkcode options} prior to formatting.
   *
   * This is the programmatic equivalent of the `deno fmt` command.
   *
   * @see {@linkcode formatSync} for the synchronous version of this method.
   *
   * @param {string | TemplateStringsArray | BufferSource} input The code to format, either as a string, BufferSource, or a template strings array.
   * @param {[IOptions?] | [IOptions?, ...unknown[]] | [...unknown[], IOptions]} values The options or interpolated values to be parsed and used to construct the template string. If the first or the last value are an {@linkcode Options} object, it will be merged with the existing instance {@linkcode options} prior to formatting.
   * @returns {Promise<string>} A Promise that resolves to the formatted code or rejects if any errors are encountered.
   * @throws {Error} If the formatter process exits with a non-zero exit code.
   * @throws {ReferenceError} If the formatter has been disposed.
   * @throws {TypeError} If the input is not a string or BufferSource.
   * @example
   * ```ts
   * import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";
   *
   * const fmt = await Formatter.init(); // wasm context
   *
   * const pretty = await fmt.format`const foo={
   *   a:'1',b:"2", c : 3 }${{ lineWidth: 60, useTabs: true }}`;
   *
   * const pretty2 = await fmt.format("const foo={a:'1',b:\"2\", c : 3 }", { lineWidth: 60, useTabs: true });
   *
   * console.log(pretty)
   * // const foo = {
   * //   a: "1",
   * //   b: "2",
   * //   c: 3,
   * // };
   *
   * console.log(pretty === pretty2); // true
   * ```
   */
  public async format(
    input: string | TemplateStringsArray | BufferSource,
    ...values: [IOptions?, ...unknown[]] | [...unknown[], IOptions]
  ): Promise<string | boolean> {
    this.context.disposedCheck();
    const [code, options] = this.#context.parseInput(input, values);
    if (options.check) return await this.check(code, options);
    return await this.#context.format(code, options);
  }

  /**
   * Synchronously format the given {@link input}, returning the result as a
   * string. The input may be a string, an ArrayBuffer, or an ArrayBuffer View
   * like a TypedArray or DataView. SharedArrayBuffers are supported, but are
   * not recommended for use with this method, as they may be mutated by other
   * code while the formatter is running.
   *
   * This is the programmatic equivalent of the `deno fmt` command.
   *
   * @see {@link format} for the asynchronous version of this method.
   *
   * @param {string | BufferSource} input The code to format.
   * @returns {string} The formatted code.
   * @throws {Error} If the formatter process exits with a non-zero exit code.
   * @throws {ReferenceError} If the formatter has been disposed.
   * @throws {TypeError} If the input is not a string or BufferSource.
   * @example
   * ```ts
   * import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";
   *
   * const fmt = Formatter.initSync(); // wasm context
   *
   * const ugly = `const foo={bar:"baz",qux:'quux',iam:'ugly',rrrawwwr:"😡"}`;
   *
   * // with the default options
   * const pretty = fmt.formatSync(ugly);
   * console.log(pretty)
   * // const foo = {
   * //   bar: "baz",
   * //   qux: "quux",
   * //   iam: "ugly",
   * //   rrrawwwr: "😡",
   * // };
   *
   * // with custom overrides
   * const pretty2 = fmt.formatSync(ugly, {
   *   indentWidth: 4,
   *   singleQuote: true,
   *   semiColons: false,
   * });
   *
   * console.log(pretty2);
   * // const foo = {
   * //     bar: 'baz',
   * //     qux: 'quux',
   * //     iam: 'ugly',
   * //     rrrawwwr: '😡',
   * // }
   * ```
   */
  public formatSync(input: string | BufferSource): string;

  /**
   * Synchronously checks if a given {@linkcode input} is formatted correctly,
   * returning a boolean representing the results of the check. Functionally
   * equivalent to the {@link checkSync} method.
   *
   * This is the programmatic equivalent of the `deno fmt --check` command.
   *
   * @deprecated Please use the {@link checkSync} method instead. Support for this overload will be removed in a future release.
   * @see {@link format} for the asynchronous version of this method.
   *
   * @param {string | BufferSource} input The code to check.
   * @param {IOptions} [overrides] The options to use for checking.
   * @returns {boolean} `true` if it's formatted correctly, otherwise `false`.
   * @throws {Error} If the formatter process exits with a non-zero exit code.
   * @throws {ReferenceError} If the formatter has been disposed.
   * @throws {TypeError} If the input is not a string or BufferSource.
   * @example
   * ```ts
   * import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";
   *
   * const fmt = Formatter.initSync(); // wasm context
   *
   * console.log(fmt.formatSync('const foo = { bar: "baz" };\n', { check: true }));
   * // => true (formatted correctly)
   * ```
   */
  public formatSync(
    input: string | BufferSource,
    overrides: IOptions & { check: true },
  ): boolean;

  /**
   * Synchronously formats the given {@linkcode input}, returning the result as
   * a string. You may provide an optional {@linkcode overrides} object, which
   * will be merged with the existing instance {@linkcode options} prior to
   * formatting.
   *
   * This is the programmatic equivalent of the `deno fmt` command.
   *
   * @see {@link format} for the asynchronous version of this method.
   *
   * @param {string | BufferSource} input The code to format.
   * @param {IOptions} [overrides] The options to use for formatting.
   * @returns {string} The formatted code.
   * @throws {Error} If the formatter process exits with a non-zero exit code.
   * @throws {ReferenceError} If the formatter has been disposed.
   * @throws {TypeError} If the input is not a string or BufferSource.
   *
   * @example
   * ```ts
   * import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";
   *
   * const fmt = Formatter.initSync(); // wasm context
   *
   * const ugly = `const foo={bar:"baz",qux:'quux',iam:'ugly',rrrawwwr:"😡"}`;
   *
   * // with the default options
   * const pretty = fmt.formatSync(ugly);
   *
   * console.log(pretty)
   *
   * // with custom overrides
   * const pretty2 = fmt.formatSync(ugly, {
   *   indentWidth: 4,
   *   singleQuote: true,
   *   semiColons: false,
   * });
   *
   * console.log(pretty2);
   * // const foo = {
   * //     bar: 'baz',
   * //     qux: 'quux',
   * //     iam: 'ugly',
   * //     rrrawwwr: '😡',
   * // }
   * ```
   */
  public formatSync(
    input: string | BufferSource,
    overrides?: IOptions & { check?: boolean | undefined },
  ): string;

  /**
   * Synchronously formats the given {@link input}, returning the result as a
   * string. You may optionally provide an {@linkcode overrides} object as the
   * first or last interpolated template value, which  will be merged with the
   * existing instance {@linkcode options} prior to formatting.
   *
   * This is the programmatic equivalent of the `deno fmt` command.
   *
   * @see {@link format} for the asynchronous version of this method.
   *
   * @param {TemplateStringsArray} input Template string array containing the target code to be formatted.
   * @param {[IOptions?, ...unknown[]] | [...unknown[], IOptions]} values The interpolated values to be parsed and used to construct the template string. If the first or the last value are an {@linkcode IOptions} object, it will be merged with the existing instance {@linkcode options} prior to formatting.
   * @returns {string} The formatted code.
   * @throws {Error} If the formatter process exits with a non-zero exit code.
   * @throws {ReferenceError} If the formatter has been disposed.
   * @throws {TypeError} If the input is not a string or BufferSource.
   *
   * @example
   * ```ts
   * import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";
   *
   * const fmt = Formatter.initSync(); // wasm context
   *
   * const pretty = fmt.formatSync`const foo={
   *  a:'1',b:"2", c : 3 }${{ lineWidth: 60, useTabs: true }}`;
   *
   * console.log(pretty);
   * // const foo = {
   * //   a: "1",
   * //   b: "2",
   * //   c: 3,
   * // };
   * //
   * ```
   */
  public formatSync(
    input: TemplateStringsArray,
    ...values: [IOptions?, ...unknown[]] | [...unknown[], IOptions]
  ): string;

  /**
   * Synchronously formats the given {@link input}, which is provided either
   * as a string, BufferSource, or a template strings array. Returns the
   * formatted code as a string, or a boolean representing the result of
   * comparing the formatted code to its original input. You also can provide
   * an optional {@linkcode overrides} object as the first or last interpolated
   * template value, which will be merged with the existing instance
   * {@linkcode options} prior to formatting.
   *
   * This is the programmatic equivalent of the `deno fmt` command.
   *
   * @see {@link format} for the asynchronous version of this method.
   *
   * @param {string | TemplateStringsArray | BufferSource} input The code to format, either as a string, BufferSource, or a template strings array.
   * @param {[IOptions?] | [IOptions?, ...unknown[]] | [...unknown[], IOptions]} values The options or interpolated values to be parsed and used to construct the template string. If the first or the last value are an {@linkcode IOptions} object, it will be merged with the existing instance {@linkcode options} prior to formatting.
   * @returns {string | boolean} The formatted code or a boolean representing the result of comparing the formatted code to its original input.
   * @throws {Error} If the formatter process exits with a non-zero exit code.
   * @throws {ReferenceError} If the formatter has been disposed.
   * @throws {TypeError} If the input is not a string or BufferSource.
   *
   * @example
   * ```ts
   * import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";
   *
   * const fmt = Formatter.initSync(); // wasm context
   *
   * const pretty = fmt.formatSync`const foo={
   *  a:'1',b:"2", c : 3 }${{ lineWidth: 60, useTabs: true }}`;
   *
   * console.log(pretty);
   * // const foo = {
   * //   a: "1",
   * //   b: "2",
   * //   c: 3,
   * // };
   * //
   *
   * const pretty2 = fmt.formatSync("const foo={a:'1',b:\"2\", c : 3 }", {
   *   lineWidth: 60,
   *   useTabs: true,
   * });
   *
   * console.log(pretty2 === pretty); // true
   * ```
   */
  public formatSync(
    input: string | TemplateStringsArray | BufferSource,
    ...values: [IOptions?, ...unknown[]] | [...unknown[], IOptions]
  ): string | boolean {
    this.context.disposedCheck();
    const [code, options] = this.#context.parseInput(input, values);
    if (options.check) return this.checkSync(code, options);
    return this.#context.formatSync(code, options);
  }

  /**
   * Asynchronously checks if a given {@linkcode input} is formatted correctly,
   * returning a Promise that resolves to a boolean representing the results of
   * the check.
   *
   * This is the programmatic equivalent of the `deno fmt --check` command.
   *
   * @see {@link checkSync} for the synchronous version of this method.
   *
   * @param {string | BufferSource} input The code to check.
   * @param {IOptions} [overrides] The options to use for checking.
   * @returns {Promise<boolean>} `true` if it's formatted correctly, otherwise `false`.
   * @throws {Error} If the formatter process exits with a non-zero exit code.
   * @throws {ReferenceError} If the formatter has been disposed.
   * @throws {TypeError} If the input is not a string or BufferSource.
   *
   * @example
   * ```ts
   * import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";
   *
   * const fmt = await Formatter.init(); // wasm context
   * const fmtCli = await Formatter.initLegacy(); // cli context
   *
   * const ugly = `const foo={bar:"baz"}`; // unformatted
   * const pretty = `const foo = { bar: "baz" };\n`; // formatted
   *
   * // wasm context
   * console.log(await fmt.check(ugly)); // false
   * console.log(await fmt.check(pretty)); // true
   *
   * // cli context
   * console.log(await fmtCli.check(ugly)); // false
   * console.log(await fmtCli.check(pretty)); // true
   * ```
   */
  public async check(
    input: string | BufferSource,
    overrides?: IOptions,
  ): Promise<boolean>;

  /**
   * Asynchronously checks if a given {@linkcode input} is formatted correctly,
   * returning a Promise that resolves to a boolean representing the results of
   * the check. You may provide an optional {@linkcode overrides} object, which
   * can either be the first or the last interpolated template value. It will
   * be merged with the existing instance {@linkcode options} prior to checking
   * the input code.
   *
   * This is the programmatic equivalent of the `deno fmt --check` command.
   *
   * @see {@link checkSync} for the synchronous version of this method.
   *
   * @param {TemplateStringsArray} input The code to check, provided as a literal template string.
   * @param {[IOptions?, ...unknown[]] | [...unknown[], IOptions]} values The interpolated values to be parsed and used to construct the template string. If the first or the last value are an {@linkcode IOptions} object, it will be merged with the existing instance {@linkcode options} prior to checking.
   * @returns {Promise<boolean>} `true` if it's formatted correctly, otherwise `false`.
   * @throws {Error} If the formatter process exits with a non-zero exit code.
   * @throws {ReferenceError} If the formatter has been disposed.
   * @throws {TypeError} If the input is not a string or BufferSource.
   *
   * @example
   * ```ts
   * import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";
   *
   * const fmt = await Formatter.init(); // wasm context
   * const fmtCli = await Formatter.initLegacy(); // cli context
   *
   * const ugly = `const foo={bar:"baz"}`; // unformatted
   * const pretty = `const foo = { bar: "baz" };\n`; // formatted
   *
   * // wasm context
   * console.log(await fmt.check(ugly)); // false
   * console.log(await fmt.check(pretty)); // true
   *
   * // cli context
   * console.log(await fmtCli.check(ugly)); // false
   * console.log(await fmtCli.check(pretty)); // true
   * ```
   */
  public async check(
    input: TemplateStringsArray,
    ...values: [IOptions?, ...unknown[]] | [...unknown[], IOptions]
  ): Promise<boolean>;

  /**
   * Asynchronously checks if a given {@linkcode input} is formatted correctly,
   * either as a string, BufferSource, or a template strings array. Returns a
   * Promise that resolves to a boolean representing the results of the check.
   * You may provide an optional `overrides` object, which can either be the
   * first or the last interpolated template value. It will be merged with the
   * existing instance {@linkcode options} prior to checking the input code.
   *
   * This is the programmatic equivalent of the `deno fmt --check` command.
   *
   * @see {@link checkSync} for the synchronous version of this method.
   *
   * @param {string | TemplateStringsArray | BufferSource} input The code to check, either as a string, BufferSource, or a template strings array.
   * @param {[IOptions?] | [IOptions?, ...unknown[]] | [...unknown[], IOptions]} values The options or interpolated values to be parsed and used to construct the template string. If the first or the last value are an {@linkcode IOptions} object, it will be merged with the existing instance {@linkcode options} prior to checking.
   * @returns {Promise<boolean>} `true` if it's formatted correctly, otherwise `false`.
   * @throws {Error} If the formatter process exits with a non-zero exit code.
   * @throws {ReferenceError} If the formatter has been disposed.
   * @throws {TypeError} If the input is not a string or BufferSource.
   */
  public async check(
    input: string | BufferSource | TemplateStringsArray,
    ...values: unknown[]
  ): Promise<boolean> {
    this.context.disposedCheck();
    const [code, options] = this.context.parseInput(input, values);
    return await this.context.check(code, options);
  }

  /**
   * Synchronously checks if a given {@linkcode input} is formatted correctly,
   * returning a boolean representing the results of the check.
   *
   * This is the programmatic equivalent of the `deno fmt --check` command.
   *
   * @see {@link check} for the asynchronous version of this method.
   *
   * @param {string | BufferSource} input The code to check.
   * @param {IOptions} [overrides] The options to use for checking.
   * @returns {boolean} `true` if it's formatted correctly, otherwise `false`.
   * @throws {Error} If the formatter process exits with a non-zero exit code.
   * @throws {ReferenceError} If the formatter has been disposed.
   * @throws {TypeError} If the input is not a string or BufferSource.
   *
   * @example
   * ```ts
   * import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";
   *
   * const fmt = Formatter.initSync(); // wasm context
   * const fmtCli = Formatter.initLegacySync(); // cli context
   *
   * const ugly = `const foo={bar:"baz"}`; // unformatted
   * const pretty = `const foo = { bar: "baz" };\n`; // formatted
   *
   * // wasm context
   * console.log(fmt.checkSync(ugly)); // false
   * console.log(fmt.checkSync(pretty)); // true
   *
   * // cli context
   * console.log(fmtCli.checkSync(ugly)); // false
   * console.log(fmtCli.checkSync(pretty)); // true
   * ```
   */
  public checkSync(input: string | BufferSource, overrides?: IOptions): boolean;

  /**
   * Synchronously checks if a given {@linkcode input} is formatted correctly,
   * returning a boolean representing the results of the check. You may provide
   * an optional {@linkcode overrides} object, which can either be the first or
   * the last interpolated template value. It will be merged with the existing
   * instance {@linkcode options} prior to checking the input code.
   *
   * This is the programmatic equivalent of the `deno fmt --check` command.
   *
   * @see {@link check} for the asynchronous version of this method.
   *
   * @param {TemplateStringsArray} input The code to check, provided as a literal template string.
   * @param {[IOptions?, ...unknown[]] | [...unknown[], IOptions]} values The interpolated values to be parsed and used to construct the template string. If the first or the last value are an {@linkcode IOptions} object, it will be merged with the existing instance {@linkcode options} prior to checking.
   * @returns {boolean} `true` if it's formatted correctly, otherwise `false`.
   * @throws {Error} If the formatter process exits with a non-zero exit code.
   * @throws {ReferenceError} If the formatter has been disposed.
   * @throws {TypeError} If the input is not a string or BufferSource.
   *
   * @example
   * ```ts
   * import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";
   *
   * const fmt = Formatter.initSync(); // wasm context
   * const fmtCli = Formatter.initLegacySync(); // cli context
   *
   * const ugly = `const foo={bar:"baz"}`; // unformatted
   * const pretty = `const foo = { bar: "baz" };\n`; // formatted
   *
   * // wasm context
   * console.log(fmt.checkSync(ugly)); // false
   * console.log(fmt.checkSync(pretty)); // true
   *
   * // cli context
   * console.log(fmtCli.checkSync(ugly)); // false
   * console.log(fmtCli.checkSync(pretty)); // true
   * ```
   */
  public checkSync(
    input: TemplateStringsArray,
    ...values: [IOptions?, ...unknown[]] | [...unknown[], IOptions]
  ): boolean;

  /**
   * Synchronously checks if a given {@linkcode input} is formatted correctly,
   * either as a string, BufferSource, or a template strings array. Returns a
   * boolean representing the results of the check. You may provide an optional
   * `overrides` object, which can either be the first or the last interpolated
   * template value. It will be merged with the existing instance
   * {@linkcode options} prior to checking the input code.
   *
   * This is the programmatic equivalent of the `deno fmt --check` command.
   *
   * @see {@link check} for the asynchronous version of this method.
   *
   * @param {string | TemplateStringsArray | BufferSource} input The code to check, either as a string, BufferSource, or a template strings array.
   * @param {[IOptions?] | [IOptions?, ...unknown[]] | [...unknown[], IOptions]} values The options or interpolated values to be parsed and used to construct the template string. If the first or the last value are an {@linkcode IOptions} object, it will be merged with the existing instance {@linkcode options} prior to checking.
   * @returns {boolean} `true` if it's formatted correctly, otherwise `false`.
   * @throws {Error} If the formatter process exits with a non-zero exit code.
   * @throws {ReferenceError} If the formatter has been disposed.
   * @throws {TypeError} If the input is not a string or BufferSource.
   */
  public checkSync(
    input: string | BufferSource | TemplateStringsArray,
    ...values: unknown[]
  ): boolean {
    this.context.disposedCheck();
    const [code, options] = this.context.parseInput(input, values);
    return this.context.checkSync(code, options);
  }

  [Symbol.dispose](): void {
    if (!this.context.disposed) {
      this.config.cleanup?.call(this);
      this.context.disposed = true;
    }
  }

  get [Symbol.toStringTag](): string {
    return "Formatter";
  }

  [Symbol.for("nodejs.util.inspect.custom")](
    depth: number | null,
    options: InspectOptionsStylized,
    inspect: (v: unknown, o?: InspectOptions) => string,
  ): string {
    const { stylize: s } = options, sp = "special";
    const tag = `${s(`[${this.constructor.name}: `, sp)}${s(this.context.name, "string")}${
      s("]", sp)
    }`;

    if (depth === null || depth < 0) return tag;

    const { config, options: opts } = this;

    return `${tag} ${
      inspect({ config, options: opts }, {
        ...options,
        getters: true,
        compact: 3,
        colors: true,
      })
    }`;
  }
}

export declare namespace Formatter {
  export interface Wasm extends Formatter {
    readonly config: Config.Resolved & { readonly type: "wasm" };
    readonly context: WasmContext;
  }

  export interface Legacy extends Formatter {
    readonly config: Config.Resolved & { readonly type: "cli" };
    readonly context: CommandContext;
  }
}

const type = typeof Deno.Command === "function" ? "cli" : "wasm";

export const fmt: Formatter = await Formatter.init({ type });

export const { format, formatSync, check, checkSync } = fmt;

export default fmt;
