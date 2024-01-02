import { LRU } from "./lru.ts";
import { Sha256 } from "./sha256.ts";
import { IOptions, Options } from "./options.ts";
import { dprint } from "./dprint.ts";
import { Config } from "./fmt.ts";
import { bindSafe, encode, decode } from "./helpers.ts";

/**
 * The abstract Context class is the base for the underlying formatter APIs for
 * both the CLI and the WASM implementations. Depending on the environment that
 * the formatter is executed in, it may need to utilize the dprint-powered WASM
 * Context, e.g. in Deno Deploy. If it's able to access the Deno.Command API,
 * and if the `allow-run` permission is granted, it may use the CommandContext
 * instead.
 */
export abstract class Context<K extends string = string> {
  #disposed = false;
  #config: Config & { options: Options } = {
    type: "wasm",
    cache: {
      /** Cache capacity (default: 100 entry limit). */
      capacity: 100,
      /** Cache TTL/max-age (default: 30 min). */
      ttl: 1000 * 60 * 30,
      /** Cache disposal hook (default: none). */
      ondispose() {},
      /** Cache removal hook (default: none). */
      onremove() {},
      /** Cache refresh hook (default: none). */
      onrefresh() {},
    },
    options: new Options({ ...Options.default }),
  };

  #cacheKey: string | null = null;
  #cache!: LRU<string>;

  abstract readonly name: K;

  constructor(config?: Config) {
    const { type = "wasm", cache, cleanup } = config ?? {};
    const options = config?.options as Options | undefined;
    this.#config = {
      ...this.#config,
      type,
      cache,
      cleanup,
    };
    if (options) {
      this.#config.options = Options.normalize(
        Options.merge(options, this.options),
      );
    }
  }

  get config(): Config {
    return this.#config;
  }

  get disposed(): boolean {
    return this.#disposed;
  }

  set disposed(value: boolean) {
    if (!this.#disposed) this.#disposed = !!value;
  }

  get options(): Options.Resolved {
    return this.#config.options ??= new Options({ ...Options.default });
  }

  get cache(): LRU<string> {
    // deno-lint-ignore ban-types
    const config = {} as Exclude<Config["cache"] & {}, boolean>;
    if (this.#config.cache === false) {
      config.capacity = 0;
      config.ttl = 0;
    } else if (this.#config.cache === true) {
      config.capacity = 100;
      config.ttl = 1000 * 60 * 30;
    } else {
      Object.assign(config, this.#config.cache);
    }
    const cacheKey = JSON.stringify(
      Object.fromEntries(
        Object.entries(config).map(([k, v]) => [String(k), String(v)]).sort(),
      ),
    );
    if (!this.#cache || this.#cacheKey !== cacheKey) {
      this.#cacheKey = cacheKey;
      this.#cache = new LRU(config);
    }
    return this.#cache;
  }

  /**
   * Asynchronously format the input string, returning the formatted string.
   * Optionally accepts an `overrides` object, to override the instance options.
   *
   * Note that this method only accepts string inputs; any other allowed types
   * will be converted to string before being passed to this method.
   */
  abstract format(input: string, overrides?: Options): Promise<string>;

  /**
   * Synchronously format the input string, returning the formatted string.
   * Optionally accepts an `overrides` object, to override the instance options.
   *
   * Note that this method only accepts string inputs; any other allowed types
   * will be converted to string before being passed to this method.
   */
  abstract formatSync(input: string, overrides?: Options): string;

  /**
   * Asynchronously check if the input string is formatted, returning a boolean.
   * Optionally accepts an `overrides` object, to override the instance options.
   *
   * Note that this method only accepts string inputs; any other allowed types
   * will be converted to string before being passed to this method.
   */
  async check(input: string, overrides?: Options): Promise<boolean> {
    return (await this.format(input, overrides)) === input;
  }

  /**
   * Synchronously check if the input string is formatted, returning a boolean.
   * Optionally accepts an `overrides` object, to override the instance options.
   *
   * Note that this method only accepts string inputs; any other allowed types
   * will be converted to string before being passed to this method.
   */
  checkSync(input: string, overrides?: Options): boolean {
    return this.formatSync(input, overrides) === input;
  }

  parseInput(
    input: string | BufferSource | TemplateStringsArray,
    values: unknown[],
  ): [code: string, options: Options] {
    const overrides: Options = Object.assign(
      {},
      ...values.filter(Options.hasInstance),
    );
    const options = Options.merge(overrides, this.options);
    const interpolations = values.filter((v) => !Options.hasInstance(v));

    let code = "";
    if (typeof input === "string") {
      code = input;
    } else if (ArrayBuffer.isView(input) || input instanceof ArrayBuffer) {
      code = decode(input);
    } else if ("raw" in input && Array.isArray(input.raw)) {
      code = String.raw({ raw: input }, ...interpolations);
    }

    return [code, options];
  }

  getCanonicalHash(
    data: string | BufferSource,
    options?: Options,
  ): string {
    const hasher = new Sha256();
    options = Options.merge(options ?? {}, this.options);

    let canonical = JSON.parse(JSON.stringify(options));
    canonical = Object.fromEntries(Object.entries(canonical).sort());
    hasher.update(JSON.stringify(canonical));

    data = typeof data === "string" ? data : decode(data);
    hasher.update(data);

    return hasher.hex();
  }

  disposedCheck(): void {
    if (this.disposed) throw new ReferenceError("Formatter has been disposed");
  }
}

export class WasmContext extends Context<"wasm"> {
  get name(): "wasm" {
    return "wasm";
  }

  #plugins = {} as {
    json: dprint.Formatter;
    markdown: dprint.Formatter;
    toml: dprint.Formatter;
    typescript: dprint.Formatter;
  };

  #extMap = {
    typescript: [
      "ts",
      "js",
      "tsx",
      "jsx",
      "cjs",
      "mjs",
      "cts",
      "mts",
      "d.ts",
    ],
    json: ["json", "jsonc", "jsonl", "jsonld", "jsonlines"],
    toml: ["toml"],
    markdown: ["md", "markdown", "mdx", "mdown"],
  } as const;

  constructor(config?: Config) {
    super(config);

    this.format = bindSafe(this.format, this);
    this.formatSync = bindSafe(this.formatSync, this);
    this.check = bindSafe(this.check, this);
    this.checkSync = bindSafe(this.checkSync, this);
  }

  async format(input: string, overrides?: Options): Promise<string> {
    this.disposedCheck();
    const merged = Options.merge(new Options(overrides ?? {}), this.options);
    const options = Options.convertToDprint(merged);
    const hash = this.getCanonicalHash(input, merged);
    let cached = this.cache.get(hash);
    if (!cached) {
      const plugin = await this.getPlugin(overrides);
      // match the behavior of the command context
      try {
        cached = plugin.format(input, options);
      } catch (err) {
        if (err.message.startsWith("Unexpected ")) {
          return input;
        } else {
          throw err;
        }
      }
      this.cache.set(hash, cached);
    }
    return await Promise.resolve(cached);
  }

  formatSync(input: string, overrides?: Options): string {
    this.disposedCheck();
    const merged = Options.merge(new Options(overrides ?? {}), this.options);
    const options = Options.convertToDprint(merged);
    const hash = this.getCanonicalHash(input, merged);
    let cached = this.cache.get(hash);
    if (!cached) {
      const plugin = this.getPluginSync(overrides);
      // match the behavior of the command context
      try {
        cached = plugin.format(input, options);
      } catch (err) {
        if (err.message.startsWith("Unexpected ")) {
          return input;
        } else {
          throw err;
        }
      }
      this.cache.set(hash, cached);
    }
    return cached;
  }

  async check(input: string, overrides?: Options): Promise<boolean> {
    this.disposedCheck();
    const merged = Options.merge(overrides ?? new Options(), this.options);
    const options = merged.toDprint();
    const plugin = await this.getPlugin(merged);
    // match the behavior of the command context
    try {
      return plugin.check(input, options);
    } catch (err) {
      if (err.message.startsWith("Unexpected ")) {
        return false;
      } else {
        throw err;
      }
    }
  }

  checkSync(input: string, overrides?: Options): boolean {
    this.disposedCheck();
    const merged = Options.merge(overrides ?? new Options(), this.options);
    const options = merged.toDprint();
    const plugin = this.getPluginSync(merged);
    // match the behavior of the command context
    try {
      return plugin.check(input, options);
    } catch (err) {
      if (err.message.startsWith("Unexpected ")) {
        return false;
      } else {
        throw err;
      }
    }
  }

  async getPlugin(overrides?: IOptions): Promise<dprint.Formatter> {
    let key: dprint.PluginName = "typescript";

    for (const [plugin, exts] of Object.entries(this.#extMap)) {
      if (exts.includes((overrides?.ext ?? this.options.ext) as never)) {
        key = plugin as dprint.PluginName;
        break;
      }
    }
    return this.#plugins[key] ??= await dprint.getPlugin(key);
  }

  getPluginSync(overrides?: IOptions): dprint.Formatter {
    let key: dprint.PluginName = "typescript";

    for (const [plugin, exts] of Object.entries(this.#extMap)) {
      if (exts.includes((overrides?.ext ?? this.options.ext) as never)) {
        key = plugin as dprint.PluginName;
        break;
      }
    }
    return this.#plugins[key] ??= dprint.getPluginSync(key);
  }

  async init(): Promise<void> {
    await this.getPlugin(this.options);
  }

  initSync(): void {
    this.getPluginSync(this.options);
  }

  [Symbol.dispose](): void {
    if (!this.disposed) {
      if (this.config.cleanup && typeof this.config.cleanup === "function") {
        // @ts-ignore the function is bound to the formatter
        this.config.cleanup();
      }
      this.disposed = true;
    }
  }
}

export class CommandContext extends Context<"cli"> {
  #commandOptions: Deno.CommandOptions = {
    args: ["fmt"],
    env: { NO_COLOR: "1" },
    stdout: "piped",
    stderr: "piped",
    stdin: "null",
  };

  constructor(config?: Config) {
    super(config);

    this.format = bindSafe(this.format, this);
    this.formatSync = bindSafe(this.formatSync, this);
    this.check = bindSafe(this.check, this);
    this.checkSync = bindSafe(this.checkSync, this);
  }

  get name(): "cli" {
    return "cli";
  }

  public async format(input: string, overrides?: IOptions): Promise<string> {
    await this.#ensureRunPermission();
    this.disposedCheck();

    const options = Options.merge(overrides ?? new Options(), this.options);
    const hash = this.getCanonicalHash(input, options);
    let output = this.cache.get(hash);

    if (output === undefined) {
      const buffer = encode(input);
      const flags = Options.convertToFlags(options);

      const commandOptions = {
        ...this.#commandOptions,
        stdout: "piped",
        stderr: "piped",
        stdin: "piped",
        args: ["fmt", ...flags, "-"] as string[],
      } as const;

      const cmd = new Deno.Command(Deno.execPath(), commandOptions).spawn();

      // 1. prevent Deno from exiting early
      cmd.ref();

      // 8kb chunk size seems reasonable
      const CHUNK_SIZE = 1024 * 8;

      // 2. pipe the input data into the subprocess stdin
      const writer = cmd.stdin.getWriter();

      await writer.ready;
      let offset = 0;
      while (offset < buffer.length) {
        // using subarray means we're performing a no-copy write operation
        const chunk = buffer.subarray(
          offset,
          offset = Math.min(offset + CHUNK_SIZE, buffer.length),
        );
        await writer.write(chunk);
      }

      // 3) wait for the writer to signal that it's finished
      await writer.ready.then(() => writer.close());

      // 4) collect subprocess outputs: formatted code or error message
      const result = await cmd.output();

      // 5) unref the subprocess so Deno can exit
      cmd.unref();

      // 5) decode the output into a string (streaming enabled)
      const stdout = decode(result.stdout, { stream: true });
      decode();

      // 6) decode stderr output, same as #5 above
      const stderr = decode(result.stderr, { stream: true });
      decode();

      const { code: exitCode } = result;

      let err: Error | null = null;
      if (exitCode !== 0) {
        let cause: Error | undefined;
        if (stderr.length > 0 && this.#hasErrors(stderr)) {
          cause = new Error(stderr);
        } else if (stdout.length > 0 && this.#hasErrors(stdout)) {
          cause = new Error(stdout);
        }
        err = new Error(`[fmt] Process exited with code ${exitCode}.`, {
          cause,
        });
        Error.captureStackTrace?.(err);
        Object.assign(err, { commandOptions, options, context: this });
        throw err;
      }

      this.cache.set(hash, output = stdout);
    }

    return output;
  }

  public formatSync(input: string, overrides?: IOptions): string {
    this.#ensureRunPermissionSync();
    this.disposedCheck();

    const options = Options.merge(overrides ?? new Options(), this.options);
    const { ext } = options;
    const hash = this.getCanonicalHash(input, options);
    let output = this.cache.get(hash);

    if (output === undefined) {
      const buffer = encode(input);
      // using tmp = this.#createTempFile(input, options);
      const tmpfile = Deno.makeTempFileSync({ suffix: `.${ext}` });
      using tmp = Deno.openSync(tmpfile, {
        create: true,
        write: true,
        truncate: true,
      });

      let n = 0;
      while (n < buffer.length) n += tmp.writeSync(buffer.subarray(n));

      const flags = Options.convertToFlags(options);
      const commandOptions = {
        ...this.#commandOptions,
        args: ["fmt", ...flags, tmpfile],
      };

      const command = new Deno.Command(Deno.execPath(), commandOptions);
      const { code: exitCode, ...result } = command.outputSync();

      const stdout = decode(result.stdout);
      const stderr = decode(result.stderr);

      let err: Error | null = null;
      if (exitCode !== 0) {
        let cause: Error | undefined;
        if (stderr.length > 0 && this.#hasErrors(stderr)) {
          cause = new Error(stderr);
        } else if (stdout.length > 0 && this.#hasErrors(stdout)) {
          cause = new Error(stdout);
        }
        err = new Error(`[fmt] Process exited with code ${exitCode}.`, {
          cause,
        });
        Error.captureStackTrace?.(err);
        Object.assign(err, { commandOptions, options, context: this, tmp });
        throw err;
      }

      output = Deno.readTextFileSync(tmpfile);
      this.cache.set(hash, output);
    }

    return output;
  }

  async #ensureRunPermission(): Promise<void> {
    const { state } = await Deno.permissions.request({
      name: "run",
      command: Deno.execPath(),
    });
    if (state !== "granted") {
      throw new Deno.errors.PermissionDenied("[fmt] Run permission required.");
    }
  }

  #ensureRunPermissionSync(): void {
    const { state } = Deno.permissions.requestSync({
      name: "run",
      command: Deno.execPath(),
    });
    if (state !== "granted") {
      throw new Deno.errors.PermissionDenied("[fmt] Run permission required.");
    }
  }

  #hasErrors(stdout: string | BufferSource): boolean {
    stdout = typeof stdout === "string" ? stdout : decode(stdout);
    if (stdout.startsWith("Checked ")) return false;
    return /^(?:error:(?: Found [1-9][0-9]* not formatted files?)?|Not formatted(?: stdin)?)/dim
      .test(stdout);
  }

  [Symbol.dispose](): void {
    if (!this.disposed) {
      if (this.config.cleanup && typeof this.config.cleanup === "function") {
        // @ts-ignore the function is bound to the formatter
        this.config.cleanup();
      }
      this.disposed = true;
    }
  }

  async [Symbol.asyncDispose](): Promise<void> {
    if (!this.disposed) {
      this.disposed = true;
      if (this.config.cleanup && typeof this.config.cleanup === "function") {
        // @ts-ignore the function is bound to the formatter
        await Promise.resolve(this.config.cleanup());
      }
    }
  }
}
