import { callsites } from "./helpers.ts";
import type { InspectOptions, InspectOptionsStylized } from "./types.d.ts";

export const defaultOptions = {
  useTabs: false,
  lineWidth: 80,
  indentWidth: 2,
  semiColons: true,
  singleQuote: false,
  proseWrap: "always",
  ext: "ts",
  check: false,
  config: true,
  ignore: [] as [],
  cwd: ".",
} satisfies Options.Resolved;
export type defaultOptions = typeof defaultOptions;

export default defaultOptions;

/**
 * Options for controlling the behavior of the `fmt` module. These options are
 * converted to their corresponding command-line flags prior to execution, at
 * which point they are piped to the `deno fmt` command.
 */
export interface IOptions {
  /**
   * Check if the source code is formatted, without modifying it at all. When
   * this flag is enabled, the output is a Promise that resolves to `true` if
   * the code is formatted correctly (equivalent to a `0` exit code) or `false`
   * if it is not (equivalent to a non-`0` exit code). Defaults to `false`.
   *
   * Possible values: `true`, `false`
   *
   * Command-line syntax:
   * ```sh
   * --check
   * ```
   *
   * @default false
   * @category Formatting
   */
  check?: boolean | undefined;

  /**
   * Use the specified configuration file, or disable searching for one.
   * Defaults to `true`.
   *
   * Command-line syntax:
   * ```sh
   * --no-config[=true|false]
   * ```
   *
   * @default true
   * @category Configuration
   */
  config?: Options.Config | undefined;

  /**
   * The working directory from which to search for configuration files. Defaults to `.`.
   *
   * Command-line syntax:
   * ```sh
   * --cwd <path>
   * ```
   *
   * @default "."
   * @category Configuration
   */
  cwd?: string | URL | undefined;

  /**
   * Set the content type of the supplied content. Defaults to `ts`. You must
   * specify the correct content type when formatting content that is not the
   * default of TypeScript or JavaScript, or formatting will probably fail.
   *
   * Possible values: `ts`, `tsx`, `js`, `jsx`, `md`, `json`, `jsonc`
   *
   * Command-line syntax:
   * ```sh
   * --ext <ts|tsx|js|jsx|md|json|jsonc>
   * ```
   *
   * @default "ts"
   * @example
   * ```ts
   * // formatting a Markdown file
   * fmt("# README\\n\\n    -    Hello, world!", { ext: "md" })
   * ```
   * @category Formatting
   */
  ext?: Options.Ext | undefined;

  /**
   * Ignore formatting particular source files. Defaults to `[]`.
   *
   * Command-line syntax:
   * ```sh
   * -i, --ignore <GLOB>...
   * ```
   *
   * @default []
   *
   * @category Formatting
   */
  ignore?: readonly string[] | undefined;

  /**
   * Define indentation width (number of spaces). Defaults to `2`.
   *
   * Command-line syntax:
   * ```sh
   * --indent-width <number>
   * ```
   * @default 2
   * @category Formatting
   */
  indentWidth?: number | undefined;

  /**
   * Define the maximum line width. Defaults to `80`.
   *
   * Command-line syntax:
   * ```sh
   * --line-width <number>
   * ```
   *
   * @default 80
   * @category Formatting
   */
  lineWidth?: number | undefined;

  /**
   * Define how prose should be wrapped. Defaults to `always`.
   *
   * Possible values: `always`, `never`, `preserve`
   *
   * Command-line syntax:
   * ```sh
   * --prose-wrap <always|never|preserve>
   * ```
   *
   * @default "always"
   * @category Formatting
   */
  proseWrap?: Options.ProseWrap | undefined;

  /**
   * When disabled, semicolons will only be used where absolutely necessary.
   * Defaults to `true`.
   *
   * Possible values: `true`, `false`
   *
   * Command-line syntax:
   * ```sh
   * --no-semicolons[=true|false]
   * ```
   *
   * @default false
   * @category Formatting
   */
  semiColons?: boolean | undefined;

  /**
   * Use single quotes instead of double quotes. Defaults to `false`.
   *
   * Possible values: `true`, `false`
   *
   * Command-line syntax:
   * ```sh
   * --single-quote[=true|false]
   * ```
   *
   * @default false
   * @category Formatting
   */
  singleQuote?: boolean | undefined;

  /**
   * Use tabs instead of spaces. Defaults to `false`.
   *
   * Possible values: `true`, `false`
   *
   * Command-line syntax:
   * ```sh
   * --use-tabs[=true|false]
   * ```
   *
   * @default false
   * @category Formatting
   */
  useTabs?: boolean | undefined;
}

// export interface Options extends IOptions {}

type Mutable<T> = T extends object ? { -readonly [K in keyof T]: Mutable<T[K]> }
  : T;

export class Options implements IOptions {
  static readonly allowed = Object.seal(
    {
      indentWidth: [1, 255],
      lineWidth: [1, (2 ** 32) - 1] as const,
      proseWrap: ["always", "never", "preserve"],
      ext: ["ts", "js", "jsx", "tsx", "json", "jsonc", "md"],
    } as const,
  );

  static [Symbol.hasInstance](it: unknown): it is Options {
    return Function[Symbol.hasInstance].call(Options, it) || (
      typeof it === "object" && it != null && !Array.isArray(it) &&
      Object.getOwnPropertyNames(it).every((key) =>
        Object.hasOwn(Options.default, key) && (key === "config" &&
            ["string", "boolean"].includes(typeof it[key as keyof typeof it]) ||
          (
            typeof it[key as keyof typeof it] ===
              typeof Options.default[key as keyof Options.Resolved]
          ))
      )
    );
  }

  static hasInstance(it: unknown): it is Options {
    return it != null && it instanceof Options;
  }

  static filesOnly = false;

  static sanitizePath(path: string | URL): string {
    // deno-lint-ignore no-control-regex
    const badRegExp = /[^\x00-\x7F]+|[<>:"\|\?\*]+/g;

    if (new URL(path, "file://").protocol === "file:") {
      const pathname = new URL(path, "file://").pathname;
      // remove some common potentially dangerous characters from the path
      path = pathname.replace(badRegExp, "");
      // normalize slashes
      path = path.replace(/\/{2,}|\\{1,}/g, "/");

      if (path.endsWith("/") && Options.filesOnly) {
        throw new URIError(
          `Expected a file path, but received a directory: ${path} (${typeof path})`,
        );
      }
    }
    return path.toString();
  }

  static merge<
    const T extends Partial<IOptions>,
    const U extends IOptions = Options.default,
  >(
    options: T,
    fallbacks: U = Options.default as unknown as U,
  ): Options {
    for (const [key, value] of Object.entries(fallbacks)) {
      options[key as keyof T] ??= value as T[keyof T];
    }

    return options instanceof Options ? options : new Options(options);
  }

  static normalize(options: IOptions): Options {
    let sanitized = Options.merge(options);
    if (!Function[Symbol.hasInstance].call(Options, options)) {
      sanitized = new Options(sanitized);
    }

    const {
      check = Options.default.check,
      config = Options.default.config,
      cwd = Options.default.cwd,
      ext = Options.default.ext,
      ignore = Options.default.ignore,
      indentWidth = Options.default.indentWidth,
      lineWidth = Options.default.lineWidth,
      proseWrap = Options.default.proseWrap,
      semiColons = Options.default.semiColons,
      singleQuote = Options.default.singleQuote,
      useTabs = Options.default.useTabs,
    } = sanitized;

    if (typeof check === "boolean") {
      sanitized.check = check;
    } else if (check !== undefined) {
      const error = new TypeError(
        `[fmt] Expected a boolean for 'check', but received: ${check} (${typeof check}).`,
      );
      Error.captureStackTrace?.(error, Options.normalize);
      throw error;
    }

    if (["true", "false", "0", "1"].includes(String(config).trim())) {
      sanitized.config = Boolean(JSON.parse(String(config).trim()));
    } else if (typeof config === "string") {
      try {
        sanitized.config = new URL(config, import.meta.url).toString();
      } catch {
        const error = new TypeError(
          `[fmt] Expected either a boolean or valid file path for 'config', but received: ${config} (${typeof config}).`,
        );
        Error.captureStackTrace?.(error, Options.normalize);
        throw error;
      }
      sanitized.config = config.toString().replace(/^file:\/\//, "");
    }

    if (typeof cwd === "string") {
      const stack = callsites();
      const baseURL =
        (stack[1]?.getFileName() ?? stack[0]?.getFileName() ?? "").replace(
          /\/[^\/]+$/,
          "",
        ) || "file:///";
      if (!URL.canParse(cwd, baseURL)) {
        sanitized.cwd = new URL("./", baseURL).toString();
      } else {
        sanitized.cwd = new URL(cwd, baseURL).toString();
      }
    } else if (cwd !== undefined) {
      const error = new TypeError(
        `[fmt] Expected a string for 'cwd', but received: ${cwd} (${typeof cwd}).`,
      );
      Error.captureStackTrace?.(error, Options.normalize);
      throw error;
    }

    if (
      Options.allowed.ext.includes(
        String(ext).toLowerCase().trim() as Options.Ext,
      )
    ) {
      sanitized.ext = String(ext).toLowerCase().trim() as Options.Ext;
    } else if (ext !== undefined) {
      const error = new TypeError(
        `[fmt] Expected one of '${
          Options.allowed.ext.join("', '")
        }' for 'ext', but received: ${ext} (${typeof ext}).`,
      );
      Error.captureStackTrace?.(error, Options.normalize);
      throw error;
    }

    if (Array.isArray(ignore)) {
      sanitized.ignore = ignore.flat().map(String); // Convert all items to strings
    } else if (typeof ignore === "string") {
      sanitized.ignore = [ignore];
    } else if (ignore !== undefined) {
      const error = new TypeError(
        `[fmt] Expected an array of strings, a single string, or undefined for 'ignore', but received: ${ignore} (${typeof ignore}).`,
      );
      Error.captureStackTrace?.(error, Options.normalize);
      throw error;
    }

    if (
      typeof indentWidth === "number" && !isNaN(indentWidth) &&
      Number.isInteger(indentWidth)
    ) {
      const [min, max] = Options.allowed.indentWidth;
      if (isFinite(indentWidth) && indentWidth >= min && indentWidth <= max) {
        sanitized.indentWidth = indentWidth;
      } else {
        const error = new RangeError(
          `[fmt] Expected a positive finite integer between [${min}, ${max}] for 'indentWidth', but received: ${indentWidth} (${typeof indentWidth}).`,
        );
        Error.captureStackTrace?.(error, Options.normalize);
        throw error;
      }
    } else {
      const error = new TypeError(
        `[fmt] Expected a positive finite integer for 'indentWidth', but received: ${indentWidth} (${typeof indentWidth}).`,
      );
      Error.captureStackTrace?.(error, Options.normalize);
      throw error;
    }

    if (
      typeof lineWidth === "number" && !isNaN(lineWidth) &&
      Number.isInteger(lineWidth)
    ) {
      const [min, max] = Options.allowed.lineWidth;
      if (lineWidth >= min && lineWidth <= max) {
        sanitized.lineWidth = lineWidth;
      } else {
        const error = new RangeError(
          `[fmt] Expected a positive integer between [${min}, ${max}] for 'lineWidth', but received: ${lineWidth} (${typeof lineWidth}).`,
        );
        Error.captureStackTrace?.(error, Options.normalize);
        throw error;
      }
    } else {
      const error = new TypeError(
        `[fmt] Expected a non-zero integer for 'lineWidth', but received: ${lineWidth} (${typeof lineWidth}).`,
      );
      Error.captureStackTrace?.(error, Options.normalize);
      throw error;
    }

    if (
      typeof semiColons === "boolean" ||
      semiColons === "true" || semiColons === "false"
    ) {
      sanitized.semiColons = JSON.parse(String(semiColons));
    } else if (semiColons !== undefined) {
      const error = new TypeError(
        `[fmt] Expected a boolean for 'semiColons', but received: ${semiColons} (${typeof semiColons}).`,
      );
      Error.captureStackTrace?.(error, Options.normalize);
      throw error;
    }

    if (
      typeof singleQuote === "boolean" ||
      singleQuote === "true" || singleQuote === "false"
    ) {
      sanitized.singleQuote = JSON.parse(String(singleQuote));
    } else if (singleQuote !== undefined) {
      const error = new TypeError(
        `[fmt] Expected a boolean for 'singleQuote', but received: ${singleQuote} (${typeof singleQuote}).`,
      );
      Error.captureStackTrace?.(error, Options.normalize);
      throw error;
    }

    if (
      typeof useTabs === "boolean" ||
      useTabs === "true" || useTabs === "false"
    ) {
      sanitized.useTabs = JSON.parse(String(useTabs));
    } else if (useTabs !== undefined) {
      throw new Error("Invalid value for useTabs option.");
    }

    if (Options.allowed.proseWrap.includes(proseWrap || "")) {
      sanitized.proseWrap = proseWrap;
    } else if (proseWrap !== undefined) {
      const error = new TypeError(
        `[fmt] Expected either 'always', 'never', or 'preserve' for 'proseWrap', but received: ${proseWrap} (${typeof proseWrap}).`,
      );
      Error.captureStackTrace?.(error, Options.normalize);
      throw error;
    }

    return sanitized as Options;
  }

  /**
   * Validates and converts options from a JavaScript-style notation into an
   * array of their equivalent Command Line flags, suitable for passing to
   * the `Deno.Command` subprocess API as the `args` option. Since we are using
   * a shell command to format our code, we must ensure that the options are
   * properly escaped and formatted for the shell environment. Otherwise, we
   * could open up our users to being vulnerable for code injection attacks.
   *
   * @example
   * ```ts
   * Options.convert({ useTabs: true, indentWidth: 4, lineWidth: 120 });
   * // => ["--use-tabs", "--indent-width", "4", "--line-width", "120"]
   * ```
   */
  static convertToFlags(input: IOptions): string[] {
    const options = Options.normalize(input);
    const flags: string[] = [];

    if (options.check) flags.push("--check");
    if (options.config === false) {
      flags.push("--no-config");
    } else if (typeof options.config === "string") {
      flags.push("--config", String(options.config));
    }
    if (options.ext) flags.push("--ext", options.ext);
    if (options.ignore.length) {
      flags.push(`--ignore=${options.ignore}`);
    }
    if (options.indentWidth) {
      flags.push("--indent-width", String(options.indentWidth));
    }
    if (options.lineWidth) {
      flags.push("--line-width", String(options.lineWidth));
    }
    if (options.proseWrap) flags.push("--prose-wrap", options.proseWrap);
    if (options.semiColons === false) flags.push("--no-semicolons");
    if (options.singleQuote) flags.push("--single-quote");
    if (options.useTabs) flags.push("--use-tabs");

    return flags;
  }

  /**
   * Convert the options object into an object of options suitable for the
   * `dprint` formatter API. The options retured depend on the `ext` option,
   * which determines the formatter plugin to use. Each formatter plugin has
   * its own set of configuration options and defaults.
   */
  static convertToDprint(options: IOptions) {
    const merged = Options.merge(options);

    const {
      useTabs,
      indentWidth,
      lineWidth,
      semiColons,
      singleQuote,
      proseWrap,
      ext,
      check,
      config,
      ignore,
      cwd,
    } = merged;

    const opts: Partial<Record<string, unknown>> = Object.create(null);

    opts.ext = Options.allowed.ext.includes(ext!) ? ext : "ts";
    opts.check = !!check;
    opts.useTabs = useTabs;
    opts.semiColons = semiColons ? "always" : "asi";

    if (typeof indentWidth === "number" && !isNaN(indentWidth)) {
      const [min, max] = Options.allowed.indentWidth;
      if (indentWidth >= min && indentWidth <= max) {
        opts.indentWidth = indentWidth;
      }
    }

    if (typeof lineWidth === "number" && !isNaN(lineWidth)) {
      const [min, max] = Options.allowed.lineWidth;
      if (lineWidth >= min && lineWidth <= max) opts.lineWidth = lineWidth;
    }

    const quoteStyle = singleQuote ? "preferSingle" : "preferDouble";
    opts.quoteStyle = quoteStyle;

    if (["ts", "tsx", "js", "jsx", "mjs", "cjs"].includes(ext!)) {
      opts["jsx.quoteStyle"] = quoteStyle;
      // just in case the user has their options set up all weird
      opts.jsx = { ...opts.jsx ?? {}, quoteStyle };
    }

    if (proseWrap != null && Options.allowed.proseWrap.includes(proseWrap)) {
      opts.textWrap = proseWrap;
    }

    if (config === false) {
      opts.noConfig = true;
    } else if (typeof config === "string") {
      const sanitized = Options.sanitizePath(config);
      if (sanitized) opts.configPath = sanitized;
    }

    if (cwd) {
      // remove some common potentially dangerous characters from the path
      const sanitized = Options.sanitizePath(cwd.toString());
      if (sanitized) opts.cwd = sanitized;
    }

    if (ignore) {
      let ignored = [ignore].flat();
      ignored = ignored.map(String).map(Options.sanitizePath);
      if (ignored.length > 0) opts.ignore = ignored;
    }

    return opts;
  }

  static readonly convert: (typeof Options.convertToFlags) & {
    readonly dprint: typeof Options.convertToDprint;
  } = Object.assign((options: IOptions) => Options.convertToFlags(options), {
    dprint: Options.convertToDprint,
  });

  static readonly dprint: typeof Options.convertToDprint =
    Options.convertToDprint;

  static readonly default: Options.Resolved = {
    check: false,
    config: true,
    cwd: "",
    ext: "ts",
    ignore: [],
    indentWidth: 2,
    lineWidth: 80,
    proseWrap: "always",
    semiColons: true,
    singleQuote: false,
    useTabs: false,
  };

  #options = { ...Options.default } as Mutable<Required<IOptions>>;

  constructor(options?: IOptions) {
    this.#options = {
      ...Options.default,
      ...options ?? {},
    } as Mutable<Required<IOptions>>;

    const get = <K extends keyof this>(key: K): (this: this) => this[K] =>
      // deno-lint-ignore no-explicit-any
      (this as any).__lookupGetter__(key)?.bind(this)!;

    const set = <K extends keyof this>(key: K): (this: this) => this[K] =>
      // deno-lint-ignore no-explicit-any
      (this as any).__lookupSetter__(key)?.bind(this)!;

    const keys = [
      "check",
      "config",
      "cwd",
      "ext",
      "ignore",
      "indentWidth",
      "lineWidth",
      "proseWrap",
      "semiColons",
      "singleQuote",
      "useTabs",
    ] as const;
    const descriptors = {} as Record<string, PropertyDescriptor>;

    for (const key of keys) {
      descriptors[key] = {
        get: get(key),
        set: set(key),
        enumerable: true,
      };
    }

    Object.defineProperties(this, {
      ...descriptors,
      [Symbol.for("nodejs.util.inspect.custom")]: {
        value: (
          depth: null | number,
          options: InspectOptionsStylized,
          inspect: (v: unknown, o?: InspectOptions) => string,
        ): string => {
          const { stylize } = options, sp = "special";
          depth = (depth ?? options.depth ?? 2) - 1;
          if (depth < 0) return stylize(`[Options]`, sp);
          options = {
            ...options,
            depth,
            getters: true,
            colors: true,
            numericSeparator: true,
          };
          const obj = {
            ...this,
            toFlags: this.toFlags(),
          };

          return `${stylize("Options", sp)} ${inspect(obj, options)}`;
        },
        enumerable: false,
        configurable: true,
      },
    });

    return new Proxy(this, {
      has: (target, key) => {
        return (
          Reflect.has(target, key) ||
          Reflect.has(this.#options, key) ||
          Reflect.has(Options.default, key)
        );
      },
      get: (target, key) => {
        if (Reflect.has(target, key)) {
          return Reflect.get(target, key);
        } else if (Reflect.has(this.#options, key)) {
          return Reflect.get(this.#options, key);
        } else if (Reflect.has(Options.default, key)) {
          return Reflect.get(Options.default, key);
        } else {
          return undefined;
        }
      },
      ownKeys: (target) => {
        return [
          ...new Set(
            Reflect.ownKeys(target).concat(
              Reflect.ownKeys(Options.default),
            ),
          ),
        ];
      },
      defineProperty: () => false,
      deleteProperty: () => false,
      preventExtensions: () => false,
      isExtensible: () => false,
    });
  }

  get check(): boolean {
    return this.#options.check;
  }

  set check(check: boolean) {
    this.#options.check = Boolean(check);
  }

  get config(): string | boolean {
    return this.#options.config;
  }

  set config(config: Options.Config) {
    config = config === true ? true : config === false ? false : String(config);
    this.#options.config = config;
  }

  get cwd(): string {
    return String(this.#options.cwd);
  }

  set cwd(cwd: string | URL) {
    cwd = Options.sanitizePath(cwd);
    this.#options.cwd = cwd;
  }

  get ext(): Options.Ext {
    return this.#options.ext;
  }

  set ext(ext: Options.Ext) {
    ext = String(ext).toLowerCase() as Options.Ext;
    if (!Options.allowed.ext.includes(ext)) ext = "ts";
    this.#options.ext = ext;
  }

  get ignore(): readonly string[] {
    return this.#options.ignore;
  }

  set ignore(ignore: string | readonly string[]) {
    this.#options.ignore = [ignore].flat().map(String);
  }

  get indentWidth(): number {
    return this.#options.indentWidth;
  }

  set indentWidth(indentWidth: number) {
    const [min, max] = Options.allowed.indentWidth;
    this.#options.indentWidth = Math.min(
      Math.max(+indentWidth >>> 0, min),
      max,
    );
  }

  get lineWidth(): number {
    return this.#options.lineWidth;
  }

  set lineWidth(lineWidth: number) {
    const [min, max] = Options.allowed.lineWidth;
    lineWidth = +lineWidth >>> 0;
    this.#options.lineWidth = Math.min(Math.max(lineWidth, min), max);
  }

  get proseWrap(): Options.ProseWrap {
    return this.#options.proseWrap;
  }

  set proseWrap(proseWrap: Options.ProseWrap) {
    proseWrap = String(proseWrap).toLowerCase() as Options.ProseWrap;
    if (!Options.allowed.proseWrap.includes(proseWrap)) {
      proseWrap = Options.allowed.proseWrap[0];
    }
    this.#options.proseWrap = proseWrap;
  }

  get semiColons(): boolean {
    return this.#options.semiColons;
  }

  set semiColons(semiColons: boolean) {
    this.#options.semiColons = Boolean(semiColons);
  }

  get singleQuote(): boolean {
    return this.#options.singleQuote;
  }

  set singleQuote(singleQuote: boolean) {
    this.#options.singleQuote = Boolean(singleQuote);
  }

  get useTabs(): boolean {
    return this.#options.useTabs;
  }

  set useTabs(useTabs: boolean) {
    this.#options.useTabs = Boolean(useTabs);
  }

  /** Normalizes the options object, resolving all of its properties. */
  normalize(): Options {
    return Options.normalize(this);
  }

  /** Converts the options object into an object of options for `dprint`. */
  toDprint(): Partial<Record<string, unknown>> {
    return Options.convertToDprint(this);
  }

  /** Converts the options object into an array of command-line flags. */
  toFlags(): readonly string[] {
    return Options.convertToFlags(this);
  }

  /** Converts the options object into a normalized JSON object. */
  toJSON(): Options.Resolved {
    return this.normalize();
  }

  /** Converts the options object into a string of command-line flags. */
  toString(): string {
    return this.toFlags().join(" ");
  }

  static {
    Object.seal(Options.default);
    Object.freeze(Options.allowed);
  }
}

export declare namespace Options {
  export {};

  type _default = typeof Options.default;
  export type { _default as default };

  export type Config = boolean | string;
  export type Ext = "ts" | "js" | "jsx" | "tsx" | "json" | "jsonc" | "md";
  export type ProseWrap = "always" | "never" | "preserve";

  export interface Resolved extends IOptions {
    readonly check: boolean;
    readonly config: boolean | string;
    readonly cwd: string;
    readonly ext: Ext;
    readonly ignore: readonly string[];
    readonly indentWidth: number;
    readonly lineWidth: number;
    readonly proseWrap: ProseWrap;
    readonly semiColons: boolean;
    readonly singleQuote: boolean;
    readonly useTabs: boolean;
  }
}
