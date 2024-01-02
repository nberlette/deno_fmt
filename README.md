<div align="center">

# 🦖 [`deno_fmt`][deno-fmt-doc]

#### Programmatic code formatting API for Deno and Deno Deploy

</div>

Introducing the first-of-its-kind TypeScript companion API for Deno's builtin
code formatter, `deno fmt`. This module introduces both
[**asynchronous**](#asynchronous-formatting) and
[**synchronous**](#synchronous-formatting) methods for formatting code -- which
can be strings, binary data, or template literals -- while preserving all of the
native [**formatting options**][options] from the `deno fmt` command.

Explore the sections below for more detailed information on the API, options,
input types, and more.

## Usage

```ts
import * as fmt from "https://deno.land/x/deno_fmt/mod.ts";

await fmt.format("const foo={bar:'baz'}");
// => "const foo = { bar: \"baz\" };\n"

await fmt.check`const foo = { bar: "baz" };\n`;
// => true
```

All of the [**formatting options**][options] from the CLI counterpart are
supported, including `--check`, `--ext`, and `--config`. If a
[configuration file][deno-json-spec] is detected in the current working
directory (auto-detected when named `deno.json` or `deno.jsonc`), the settings
it contains will be used in place of the defaults. Options you provide will
always take precedence.

> See the [**API**](#api) and the [**Options**][options] sections for more
> information on the available methods and options.

### Asynchronous

All of the public methods have both **asynchronous** and **synchronous**
variants. See [synchronous formatting](#synchronous-formatting) for details.

#### Asynchronous Formatting

```ts
import * as fmt from "https://deno.land/x/deno_fmt/mod.ts";

await fmt.format(`class Foo{bar:number;constructor(){this.bar=1}}`, {
  indentWidth: 4,
});
// => "class Foo {\n    bar: number;\n    constructor() {\n        this.bar = 1;\n    }\n}\n"
```

#### Asynchronous Checking

```ts
import * as fmt from "https://deno.land/x/deno_fmt/mod.ts";

await fmt.check(`const foo = "bar";\n`);
// => true
```

### Synchronous

#### Naming Convention

The naming convention follows the same pattern made popular in modules such as
the Node `fs` API: synchronous versions simply inherit their names from their
asynchronous counterparts, with `"Sync"` appended to the end.

For example, the async methods `format` and `check` can be used synchronously
with `formatSync` and `checkSync`, respectively. Please be aware of the known
[**performance caveats**](#synchronous-performance-caveats) when using the
synchronous APIs.

#### Synchronous Formatting

```ts
import * as fmt from "https://deno.land/x/deno_fmt/mod.ts";

fmt.formatSync(`class Foo{bar:number;constructor(){this.bar=1}}`, {
  indentWidth: 4,
});
// => "class Foo {\n    bar: number;\n    constructor() {\n        this.bar = 1;\n    }\n}\n"
```

#### Synchronous Checking

```ts
import * as fmt from "https://deno.land/x/deno_fmt/mod.ts";

fmt.checkSync(`const foo = "bar";\n`);
// => true
```

<details><summary><b>⚠️ Caveats</b></summary>

#### Synchronous Performance Caveats

Synchronous APIs are **_not_** recommended for use in production code, since
they block the main thread while they are running. This can cause performance
issues, which become more pronounced as the size of the code being formatted
increases. Additionally, the synchronous APIs are not designed in the same
efficient manner as the asynchronous APIs, and suffer from various bottlenecks
and limitations compared to their asynchronous counterparts.

For example, when using the CLI implementation of the formatter, the `format`
method tends to perform about 300% faster than the synchronous `formatSync`
method. Why? The synchronous method is unable to take advantage of streaming
data, and must instead utilize the temporary file system to store the code,
format it with the Deno CLI, and then read the formatted code back into memory
before returning it. Those extra steps add up, and cause quite a noticeable lag
when compared to the asynchronous method.

Regardless of the performance issues, synchronous APIs still prove to serve a
purpose for many developers, and therefore are included in this module. Just be
aware of the potential performance issues, and use them sparingly.

</details>

---

## Feature Highlights

- [x] **Flexible**: Formats code as strings, binary data, or template literals.
- [x] **Documented**: Written in strict, well-documented TypeScript, with
      extensive unit tests and a simple-to-use API.
- [x] **Compatible**: Full support for all the native formatting options of the
      `deno fmt` command. Works seamlessly in any Deno environment, whether in a
      Deno CLI runtime or a cloud-based environment like Deno Deploy, thanks to
      a custom [WASM](#class-wasmcontext-powered-by-dprint) implementation of
      [`dprint`][dprint], the same formatter engine used by the Deno CLI.
- [x] **Performant**: Designed from scratch to be extremely performant, both the
      asynchronous and synchronous APIs are highly optimized for speed and
      efficiency. Features an LRU cache that drops the wait time down to 2-5ms
      for subsequent formatting calls. See [benchmarks][perf] for more details.

---

# API

## ![][badge-interface] Interface: `Options`

This module supports all of the same formatting options available in the CLI,
including `--config`, `--check`, and `--ignore`. They are rigorously validated,
converted to the corresponding CLI flag, and passed to the `deno fmt` command.

Since these options are being directly injected into a shell environment, and
considering they are being provided by the user, it's paramount that they are
fully sanitized to maintain the high level of security Deno is known for.

|        Option | Possible Values                                         | Default     | Description                                                                                |
| ------------: | :------------------------------------------------------ | :---------- | :----------------------------------------------------------------------------------------- |
|         `ext` | `"ts"` `"tsx"` `"js"` `"jsx"` `"md"` `"json"` `"jsonc"` | `"ts"`      | Explicitly specify the target code's content type. Equivalent to `--ext`.                  |
|  `semiColons` | `true` `false`                                          | `true`      | Disable to only use semicolons when necessary. Equivalent to `--no-semicolons`.            |
| `singleQuote` | `true` `false`                                          | `false`     | Use single quotes instead of double quotes. Equivalent to `--single-quote`.                |
| `indentWidth` | `[1, 255]`                                              | `2`         | Number of spaces to use for indentation. Equivalent to `--indent-width`.                   |
|   `lineWidth` | `[1, 2^32-1]`                                           | `80`        | Maximum line length. Equivalent to `--line-width`.                                         |
|     `useTabs` | `true` `false`                                          | `false`     | Use tabs instead of spaces for indentation. Equivalent to `--use-tabs`.                    |
|   `proseWrap` | `"preserve"` `"always"` `"never"`                       | `"always"`  | How to handle prose wrapping in Markdown. Equivalent to `--prose-wrap`.                    |
|       `check` | `true` `false`                                          | `false`     | Check if the code is formatted. Equivalent to `--check`.                                   |
|      `config` | `string` (`--config="..."`), `false` (`--no-config`)    | `deno.json` | Path to deno config. Set to `false` to disable. Equivalent to `-c, --config`.              |
|      `ignore` | `string` (`--ignore="..."`), `false` (`--no-ignore`)    | `undefined` | Path to ignore file. Set to `false` to disable. Equivalent to `-i, --ignore`.              |
|         `cwd` | `string`                                                | `undefined` | The current working directory to use when spawning a subprocess. Not used in WASM context. |

### ![][badge-typeAlias] Content Types

The default input language is TypeScript, which also formats JavaScript without
any issues.

| Extension               | Language    | Description                                                  |
| :---------------------- | :---------- | :----------------------------------------------------------- |
| `ts`                    | TypeScript  | **The default language**. Formats TypeScript and JavaScript. |
| `js` `mjs` `cjs`        | JavaScript  | Formats JavaScript code, but not TypeScript.                 |
| `jsx` `tsx`             | React JS/TS | Formats TSX and JSX code (like that in React components).    |
| `md` `markdown` `mdown` | Markdown    | Formats Markdown documents [using the GFM flavor][gfm].      |
| `json`                  | JSON        | Formats JSON documents.                                      |
| `jsonc`                 | JSONC       | Formats JSON documents with comments (JSONC).                |

<details><summary><b>ℹ️ Notes</b></summary>

If you are formatting a file that happens to be another type, an attempt will be
made to infer the extension from the filename. This is susceptible to many
pitfalls, however, therefore it is **strongly** recommended that you specify the
`ext` in such a scenario.

If you are formatting a _string_ of code, and it is not TypeScript or
JavaScript, you **must** explicitly specify the `ext` option for the formatter
to work correctly.

> **Note**: You should _not_ include the leading `.` in the extension.

</details>

<details><summary><b>📶 Examples</b></summary>

##### **Formatting a JSON string**

```ts
await format(`{"json":"my json data"}`, { ext: "json" });
```

Results in:

```json
{
  "json": "my json data"
}
```

##### **Formatting a Markdown Document**

```ts
await format(
  `Header 1\n===\nHeader 2\n---\n|Name|Age|\n|---|---|\n|Nick|30|\n|Jimmy|34|`,
  { ext: "md" },
);
```

Results in:

```md
# Header 1

## Header 2

| Name  | Age |
| ----- | --- |
| Nick  | 30  |
| Jimmy | 34  |
```

</details>

---

## ![][badge-interface] Interface: `Config`

The configuration options available when creating a new
[`Formatter`](#class-formatter) instance, allowing you to customize the caching
behavior and set default [`options`](#interface-options "formatting options")
for all formatting operations.

| Option    | Possible Values                                        | Default          | Description                                                                                                                                              |
| :-------- | :----------------------------------------------------- | :--------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cache`   | `true` `false` [`CacheConfig`](#interface-cacheconfig) | `true`           | Enable or disable [LRU caching][cache] of formatted code.                                                                                                |
| `cleanup` | `true` `false` `(this: Formatter) => void`             | `true`           | Callback to run when the formatter instance is disposed of.                                                                                              |
| `options` | [`Options`](#interface-options)                        | `{}`             | Default formatting options.                                                                                                                              |
| `type`    | [`"wasm"`][wasm] [`"cli"`][cli]                        | [`"wasm"`][wasm] | The formatter implementation to use. Defaults to [`"wasm"`][wasm] if running in a [Deno Deploy] context, or [`"cli"`][cli] in a [Deno CLI][cli] context. |

---

## ![][badge-interface] Interface: `CacheConfig`

The configuration options for the LRU cache used to store formatted code. The
cache is enabled by default, and can be disabled by setting the `cache` option
to `false` or by setting its `capacity` to `0`.

The cache is implemented with a custom LRU + TTL caching algorithm, and it
stores the formatted code in memory with a default maximum capacity of `100`
entries. This allows for fast (2-4ms) retrieval of previously formatted code
when the input code matches a previously cached entry.

The default TTL (max age) is 30 minutes, which means that a best-effort attempt
will be made to return the cached entry if it was created within the last 30
minutes. This is configurable via the `ttl` option.

| Option      | Possible Values                                                   | Default     | Description                                                                        |
| :---------- | :---------------------------------------------------------------- | :---------- | :--------------------------------------------------------------------------------- |
| `capacity`  | `[0, Infinity]`                                                   | `100`       | The maximum number of entries to store in the cache.                               |
| `ttl`       | `[0, Infinity]`                                                   | `1_800_000` | The maximum age (in milliseconds) of a cached entry before it is considered stale. |
| `ondispose` | `(this: LRU) => void`                                             | `() => {}`  | Callback to run when the cache itself is disposed of.                              |
| `onrefresh` | `(this: LRU, value: string, key?: string, time?: number) => void` | `() => {}`  | Callback to run when an entry is refreshed in the cache.                           |
| `onremove`  | `(this: LRU, value: string, key?: string, time?: number) => void` | `() => {}`  | Callback to run when an entry is removed from the cache.                           |

---

## ![][badge-function] Function: `format`

##### Overload #1 of 3

```ts
export function format(
  input: string | BufferSource,
  overrides?: Options,
): Promise<string>;
```

Asynchronously format the given `input`, returning the result as a string. The
input may be a string, an ArrayBuffer, or an ArrayBuffer View like a TypedArray
or DataView. SharedArrayBuffers are supported, but are not recommended for use
with this method, as they could be mutated while the formatter is running.

You may provide an optional `overrides` object, which will be merged with the
existing instance [`options`][formatter.options] prior to formatting.

> This is the programmatic equivalent of the `deno fmt` command.

| Tag      | Name                  | Description                                                |
| :------- | :-------------------- | :--------------------------------------------------------- |
| `param`  | **`input`**           | The code to format.                                        |
| `return` | **`Promise<string>`** | A Promise that resolves to the formatted code as a string. |

##### Overload #2 of 3

```ts
export function format(
  input: string | BufferSource,
  overrides: Options & {
    check: true;
  },
): Promise<boolean>;
```

Asynchronously checks if a given `input` is formatted correctly, returning a
boolean representing the results of the check. Functionally equivalent to the
[`check`][check] method.

You may provide an optional `overrides` object, which will be merged with the
existing instance [`options`][formatter.options] prior to formatting.

> This is the programmatic equivalent of the `deno fmt --check` command.

| Tag      | Name                   | Description                                                                 |
| :------- | :--------------------- | :-------------------------------------------------------------------------- |
| `param`  | **`input`**            | The code to check.                                                          |
| `param`  | **`overrides`**        | Overrides for the instance options to use when checking.                    |
| `return` | **`Promise<boolean>`** | A Promise that resolves to a boolean representing the results of the check. |

##### Overload #3 of 3

```ts
export function format(
  input: TemplateStringsArray,
  ...values: [Options] | [Options, ...unknown[]] | [...unknown[], Options]
): Promise<string>;
```

Asynchronously formats the given input, which is provided as a literal template
string, and returns a Promise that resolves to the resulting string or rejects
with any error (if one was encountered). You can provide an optional overrides
object as the first or last interpolated template value, which will be merged
with the existing instance [`options`][formatter.options] prior to formatting.

> This is the programmatic equivalent of the `deno fmt` command.

| Tag      | Name                  | Description                                                              |
| :------- | :-------------------- | :----------------------------------------------------------------------- |
| `param`  | **`input`**           | Template string array containing the target code to be formatted.        |
| `param`  | **`values`**          | The interpolated values to be parsed and used to construct the template. |
| `return` | **`Promise<string>`** | A Promise that resolves to the formatted code as a string.               |

---

## ![][badge-function] Function: `formatSync`

##### Overload #1 of 3

```ts
export function formatSync(
  input: string | BufferSource,
  overrides?: Options,
): string;
```

Synchronously format the given input, returning the result as a string. The
input may be a string, an ArrayBuffer, or an ArrayBuffer View like a TypedArray
or DataView. SharedArrayBuffers are supported, but are not recommended for use
with this method, as they could be mutated while the formatter is running.

You may provide an optional `overrides` object, which will be merged with the
existing instance [`options`][formatter.options] prior to formatting.

> This is the programmatic equivalent of the `deno fmt` command.

| Tag      | Name            | Description                              |
| :------- | :-------------- | :--------------------------------------- |
| `param`  | **`input`**     | The code to format.                      |
| `param`  | **`overrides`** | Override options to use when formatting. |
| `return` | **`string`**    | The formatted code as a string.          |

##### Overload #2 of 3

```ts
export function formatSync(
  input: string | BufferSource,
  overrides: Options & {
    check: true;
  },
): boolean;
```

Synchronously checks if a given `input` is formatted correctly, returning a
boolean representing the results of the check. Functionally equivalent to the
[`checkSync`][checksync] method.

> This is the programmatic equivalent of the `deno fmt --check` command.

| Tag      | Name            | Description                                              |
| :------- | :-------------- | :------------------------------------------------------- |
| `param`  | **`input`**     | The code to check.                                       |
| `param`  | **`overrides`** | Overrides for the instance options to use when checking. |
| `return` | **`boolean`**   | A boolean representing the results of the check.         |

##### Overload #3 of 3

```ts
export function formatSync(
  input: TemplateStringsArray,
  ...values: [Options] | [Options, ...unknown[]] | [...unknown[], Options]
): string;
```

Synchronously formats the given input, which is provided as a literal template
string, and returns the resulting string or rejects with any error (if one was
encountered). You can provide an optional overrides object as the first or last
interpolated template value, which will be merged with the existing instance
[`options`][formatter.options] prior to formatting.

> This is the programmatic equivalent of the `deno fmt` command.

| Tag      | Name         | Description                                                              |
| :------- | :----------- | :----------------------------------------------------------------------- |
| `param`  | **`input`**  | Template string array containing the target code to format.              |
| `param`  | **`values`** | The interpolated values to be parsed and used to construct the template. |
| `return` | **`string`** | The formatted code as a string.                                          |

---

## ![][badge-function] Function: `check`

##### Overload #1 of 2

```ts
export function check(
  input: string | BufferSource,
  overrides?: Options,
): Promise<boolean>;
```

Asynchronously checks if a given `input` is formatted correctly, returning a
Promise that resolves to a boolean representing the results of the check.

You may provide an optional `overrides` object, which will be merged with the
existing instance [`options`][formatter.options] prior to checking.

> This is the programmatic equivalent of the `deno fmt --check` command.

| Tag      | Name                   | Description                                                                 |
| :------- | :--------------------- | :-------------------------------------------------------------------------- |
| `param`  | **`input`**            | The code to check.                                                          |
| `param`  | **`overrides`**        | Overrides for the instance options to use when checking.                    |
| `return` | **`Promise<boolean>`** | A Promise that resolves to a boolean representing the results of the check. |

##### Overload #2 of 2

```ts
export function check(
  input: TemplateStringsArray,
  ...values: [Options] | [Options, ...unknown[]] | [...unknown[], Options]
): Promise<boolean>;
```

Asynchronously checks if a given input, which is provided as a literal template
string, is formatted correctly, returning a Promise that resolves to a boolean
representing the results of the check.

You can provide an optional overrides object as the first or last interpolated
template value, which will be merged with the existing instance
[`options`][formatter.options] prior to checking.

> This is the programmatic equivalent of the `deno fmt --check` command.

| Tag      | Name                   | Description                                                                 |
| :------- | :--------------------- | :-------------------------------------------------------------------------- |
| `param`  | **`input`**            | Template string array containing the target code to check.                  |
| `param`  | **`values`**           | The interpolated values to be parsed and used to construct the template.    |
| `return` | **`Promise<boolean>`** | A Promise that resolves to a boolean representing the results of the check. |

---

## ![][badge-function] Function: `checkSync`

##### Overload #1 of 2

```ts
export function checkSync(
  input: string | BufferSource,
  overrides?: Options,
): boolean;
```

Synchronously checks if a given `input` is formatted correctly, returning a
boolean representing the results of the check.

You may provide an optional `overrides` object, which will be merged with the
existing instance [`options`][formatter.options] prior to checking.

> This is the programmatic equivalent of the `deno fmt --check` command.

| Tag      | Name            | Description                                              |
| :------- | :-------------- | :------------------------------------------------------- |
| `param`  | **`input`**     | The code to check.                                       |
| `param`  | **`overrides`** | Overrides for the instance options to use when checking. |
| `return` | **`boolean`**   | A boolean representing the results of the check.         |

##### Overload #2 of 2

```ts
export function checkSync(
  input: TemplateStringsArray,
  ...values: [Options] | [Options, ...unknown[]] | [...unknown[], Options]
): boolean;
```

Synchronously checks if a given input, which is provided as a literal template
string, is formatted correctly, returning a boolean representing the results of
the check.

You can provide an optional overrides object as the first or last interpolated
template value, which will be merged with the existing instance
[`options`][formatter.options] prior to checking.

> This is the programmatic equivalent of the `deno fmt --check` command.

| Tag      | Name          | Description                                                              |
| :------- | :------------ | :----------------------------------------------------------------------- |
| `param`  | **`input`**   | Template string array containing the target code to check.               |
| `param`  | **`values`**  | The interpolated values to be parsed and used to construct the template. |
| `return` | **`boolean`** | A boolean representing the results of the check.                         |

---

## ![][badge-class] Class: `Formatter`

### Table of Contents

- [**Static Methods**](#static-methods "Jump to 'Static Methods'")
  - [`Formatter.init`](#formatter.init "Jump to 'Formatter.init'")
  - [`Formatter.initSync`](#formatter.initsync "Jump to 'Formatter.initSync'")
  - [`Formatter.initLegacy`](#formatter.initlegacy "Jump to 'Formatter.initLegacy'")
  - [`Formatter.initLegacySync`](#formatter.initlegacysync "Jump to 'Formatter.initLegacySync'")
- [**Accessors**](#accessors "Jump to 'Accessors'")
  - [`Formatter.config`](#formatter.config "Jump to 'Formatter.config'")
  - [`Formatter.context`](#formatter.context "Jump to 'Formatter.context'")
  - [`Formatter.options`](#formatter.options "Jump to 'Formatter.options'")
- [**Methods**](#methods "Jump to 'Methods'")
  - [`Formatter.format`](#formatter.format "Jump to 'Formatter.format'")
  - [`Formatter.formatSync`](#formatter.formatsync "Jump to 'Formatter.formatSync'")
  - [`Formatter.check`](#formatter.check "Jump to 'Formatter.check'")
  - [`Formatter.checkSync`](#formatter.checksync "Jump to 'Formatter.checkSync'")

---

### Constructor

```ts
new Formatter(config?: Config);
```

Creates a new `Formatter` instance with the specified configuration options. If
no options are provided, the default configuration will be used:
[LRU caching][cache] enabled (100 entry capacity, 30 minute TTL),
[`dprint`][dprint] WASM context is preferred, and the default
[formatting options][options] are used by all formatting operations.

##### Example #1: no cache, custom options

```ts
import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";

const fmt = new Formatter({
  cache: false,
  options: {
    ext: "tsx", // targeting TypeScript React file types
    lineWidth: 60,
    useTabs: true,
    semiColons: false,
  },
});
```

##### Example #2: with cache, default options

```ts
import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";

const fmt = new Formatter({ type: "cli", cache: true });

const fmt2 = new Formatter({
  type: "wasm",
  cache: {
    capacity: 10, // 10 entry capacity
    ttl: 60_000, // 60 seconds max-age
    onremove(value, key, time) {
      console.debug(`Evicted key '${key}' (stored at ${time}):\n\t${value}`);
    },
  },
});
```

### Static Methods

#### Formatter.init

Asynchronously initializes a new `Formatter` instance with the configuration
options provided. By default the formatter will use the [`dprint`][dprint] WASM
context, since it is the most compatible and performant option. However, if you
need to use the Deno CLI context, you can provide the `type: "cli"` option in
the configuration object.

##### Overload #1 of 2

```ts
static async init(config?: Config & { type: "wasm" }): Promise<Formatter.Wasm>;
```

Initializes a new `Formatter` instance using the [`dprint`][dprint] WASM
context.

##### Overload #2 of 2

```ts
static async init(config: Config & { type: "cli" }): Promise<Formatter.Legacy>;
```

Initializes a new `Formatter` instance with the Deno CLI context, by providing
the `type: "cli"` option in the configuration object.

#### Formatter.initSync

Synchronously initializes a new `Formatter` instance.

This method is not recommended for use unless you absolutely **must** use a
synchronous API. Instead, it's recommended that you instantiate the formatter
asynchronously at the top level of your program, since ES modules are
asynchronous by their very nature, and top-level `await` is supported in Deno.

##### Overload #1 of 2

```ts
static initSync(config: Config & { type: "cli" }): Formatter.Legacy;
```

Synchronously initializes a new `Formatter` instance using the Deno CLI context
and with the specified configuration options. If no options are provided, the
default options will be used.

##### Overload #2 of 2

```ts
static initSync(config?: Config & { type: "wasm" }): Formatter.Wasm;
```

Synchronously initializes a new `Formatter` instance using the
[`dprint`][dprint] WASM formatting context, and with the specified configuration
options. If no options are provided, the default options will be used.

#### Formatter.initLegacy

```ts
static async initLegacy(config?: Config): Promise<Formatter.Legacy>;
```

Initializes a new `Formatter` instance using the CLI context, with the given
configuration options. If no options are provided, the default options will be
used.

#### Formatter.initLegacySync

```ts
static initLegacySync(config?: Config): Formatter.Legacy;
```

Synchronously initializes a new `Formatter` instance using the CLI context, with
the given configuration options. If no options are provided, the default options
will be used.

This method is not recommended for use unless you absolutely **must** use a
synchronous API. Instead, you should instantiate the formatter asynchronously at
the top level of your program, since ES modules are asynchronous by their very
nature, and top-level `await` is supported in Deno.

---

### Accessors

#### Formatter.config

```ts
public get config(): Config.Resolved;
```

The resolved configuration object used by the formatter. This object contains
the resolved formatting options, as well as internal configurations like cache
and context type options.

#### Formatter.context

```ts
public get context(): Context;
```

Internal formatting context used by the formatter. The context is responsible
for handling the actual labor of formatting code, and is either a `WasmContext`
or a `CommandContext` instance, depending on the environment the formatter is
running in.

#### Formatter.options

```ts
public get options(): Options.Resolved;
```

The options object used by the formatter. This object is a normalized version of
the options provided to the constructor, and is used as the base object for all
formatting operations, with overrides applied on top of it.

---

### Methods

#### Formatter.format

##### Overload #1 of 5

```ts
public async format(input: string | BufferSource): Promise<string>;
```

Asynchronously format the given `input`, returning the result as a string. The
input may be a string, an ArrayBuffer, or an ArrayBuffer View like a TypedArray
or DataView.

SharedArrayBuffers _are_ supported, but **are _not_** recommended for use with
this method (they may be mutated by other code while the formatter is running).

| Tag     | Name        | Description         |
| :------ | :---------- | :------------------ |
| `param` | **`input`** | The code to format. |

###### Example

```ts
import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";

const fmt = await Formatter.init(); // wasm context

const ugly = `const foo={bar:"baz",qux:'quux',iam:'ugly',rrrawwwr:"😡"}`;
const pretty = await fmt.format(ugly);

console.log(pretty);
```

###### Output

```js
const foo = {
  bar: "baz",
  qux: "quux",
  iam: "ugly",
  rrrawwwr: "😡",
};
```

---

##### Overload #2 of 5

```ts
public async format(input: string | BufferSource, overrides: Options & {
  check: true
}): Promise<boolean>;
```

Asynchronously checks if a given `input` is formatted correctly, returning a
boolean representing the results of the check. Functionally equivalent to the
[`check`](#formatter.check "check: `check`") method.

> This is the programmatic equivalent of the `deno fmt --check` command.

| Tag     | Name            | Description                      |
| :------ | :-------------- | :------------------------------- |
| `param` | **`input`**     | The code to check.               |
| `param` | **`overrides`** | The options to use for checking. |

##### Overload #3 of 5

```ts
public async format(input: string | BufferSource, overrides?: Options & {
  check: boolean | undefined
}): Promise<string>;
```

Asynchronously formats the given `input`, returning the result as a string. You
may provide an optional `overrides` object, which will be merged with the
existing instance [`options`][formatter.options] prior to formatting.

> This is the programmatic equivalent of the `deno fmt` command.

| Tag     | Name            | Description                        |
| :------ | :-------------- | :--------------------------------- |
| `param` | **`input`**     | The code to format.                |
| `param` | **`overrides`** | The options to use for formatting. |

##### Overload #4 of 5

```ts
public async format(input: TemplateStringsArray, ...values: unknown): Promise<string>;
```

Asynchronously formats the given input, which is provided as a literal template
string, and returns a Promise that resolves to the result as a string or rejects
with any error (if one was encountered). You also can provide an optional
`overrides` object as the first or last interpolated template value, which will
be merged with the existing instance [`options`][formatter.options] prior to
formatting.

> This is the programmatic equivalent of the `deno fmt` command.

| Tag     | Name         | Description                                                                                                                                                                                                                                          |
| :------ | :----------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `param` | **`input`**  | Template string array containing the target code to be formatted.                                                                                                                                                                                    |
| `param` | **`values`** | The interpolated values to be parsed and used to construct the template string. If the first or the last value are an [`Options`][options] object, it will be merged with the existing instance [`options`](#formatter.options) prior to formatting. |

###### Example

```ts
import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";

const fmt = await Formatter.init(); // wasm context

const pretty = await fmt.format`const foo={
  a:'1',b:"2", c : 3 }${{ lineWidth: 60, useTabs: true }}`;

console.log(pretty);
```

###### Output

```js
const foo = {
  a: "1",
  b: "2",
  c: 3,
};
```

---

##### Overload #5 of 5

```ts
public async format(input: string | TemplateStringsArray | BufferSource, ...values: unknown): Promise<string | boolean>;
```

Asynchronously formats the given input, which is provided either as a string,
BufferSource, or a template strings array. Returns a Promise that resolves to
the result as a string, or rejects with any error if one was encountered. You
also can provide an optional `overrides` object as the first or last
interpolated template value, which will be merged with the existing instance
[`options`][formatter.options] prior to formatting.

> This is the programmatic equivalent of the `deno fmt` command.

| Tag     | Name         | Description                                                                                                                                                                                                                                                     |
| :------ | :----------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `param` | **`input`**  | The code to format, either as a string, BufferSource, or a template strings array.                                                                                                                                                                              |
| `param` | **`values`** | The options or interpolated values to be parsed and used to construct the template string. If the first or the last value are an [`Options`][options] object, it will be merged with the existing instance [`options`](#formatter.options) prior to formatting. |

###### Example

```ts
import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";

const fmt = await Formatter.init(); // wasm context

const pretty = await fmt.format`const foo={
  a:'1',b:"2", c : 3 }${{ lineWidth: 60, useTabs: true }}`;

const pretty2 = await fmt.format("const foo={a:'1',b:\"2\", c : 3 }", {
  lineWidth: 60,
  useTabs: true,
});

console.log(pretty);

console.log(pretty === pretty2); // true
```

###### Output

```js
const foo = {
  a: "1",
  b: "2",
  c: 3,
};
```

---

#### Formatter.formatSync

##### Overload #1 of 5

```ts
public formatSync(input: string | BufferSource): string;
```

Synchronously format the given input, returning the result as a string. The
input may be a string, an ArrayBuffer, or an ArrayBuffer View like a TypedArray
or DataView. SharedArrayBuffers are supported, but are not recommended for use
with this method, as they may be mutated by other code while the formatter is
running.

> This is the programmatic equivalent of the `deno fmt` command.

| Tag     | Name        | Description         |
| :------ | :---------- | :------------------ |
| `param` | **`input`** | The code to format. |

###### Example #1: with default options

```ts
import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";

const fmt = Formatter.initSync(); // wasm context

const ugly = `const foo={bar:"baz",qux:'quux',iam:'ugly',rrrawwwr:"😡"}`;

const pretty = fmt.formatSync(ugly);
console.log(pretty);
```

###### Output #1

```js
const foo = {
  bar: "baz",
  qux: "quux",
  iam: "ugly",
  rrrawwwr: "😡",
};
```

###### Example #2: with custom overrides

```ts
import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";

const fmt = Formatter.initSync(); // wasm context

const ugly = `const foo={bar:"baz",qux:'quux',iam:'ugly',rrrawwwr:"😡"}`;

const pretty = fmt.formatSync(ugly, {
  indentWidth: 4,
  singleQuote: true,
  semiColons: false,
});

console.log(pretty2);
```

###### Output #2

```js
const foo = {
  bar: "baz",
  qux: "quux",
  iam: "ugly",
  rrrawwwr: "😡",
};
```

---

##### Overload #2 of 5

```ts
public formatSync(input: string | BufferSource, overrides: Options & {
  check: true
}): boolean;
```

Synchronously checks if a given `input` is formatted correctly, returning a
boolean representing the results of the check. Functionally equivalent to the
[checkSync](#formatter.checksync "checkSync") method.

> This is the programmatic equivalent of the `deno fmt --check` command.

| Tag     | Name            | Description                      |
| :------ | :-------------- | :------------------------------- |
| `param` | **`input`**     | The code to check.               |
| `param` | **`overrides`** | The options to use for checking. |

###### Example

```ts
import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";

const fmt = Formatter.initSync(); // wasm context

console.log(fmt.formatSync('const foo = { bar: "baz" };\n', { check: true }));
```

###### Output

```log
true
```

---

##### Overload #3 of 5

```ts
public formatSync(input: string | BufferSource, overrides?: Options & {
  check: boolean | undefined
}): string;
```

Synchronously formats the given `input`, returning the result as a string. You
may provide an optional `overrides` object, which will be merged with the
existing instance [`options`][formatter.options] prior to formatting.

> This is the programmatic equivalent of the `deno fmt` command.

| Tag     | Name            | Description                        |
| :------ | :-------------- | :--------------------------------- |
| `param` | **`input`**     | The code to format.                |
| `param` | **`overrides`** | The options to use for formatting. |

###### Example #1: with default options

```ts
import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";

const fmt = Formatter.initSync(); // wasm context

const ugly = `const foo={bar:"baz",qux:'quux',iam:'ugly',rrrawwwr:"😡"}`;

const pretty = fmt.formatSync(ugly);

console.log(pretty);
```

###### Output #1

```js
const foo = {
  bar: "baz",
  qux: "quux",
  iam: "ugly",
  rrrawwwr: "😡",
};
```

###### Example #2: with custom overrides

```ts
import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";

const fmt = Formatter.initSync(); // wasm context

const ugly = `const foo={bar:"baz",qux:'quux',iam:'ugly',rrrawwwr:"😡"}`;

const pretty = fmt.formatSync(ugly, {
  indentWidth: 4,
  singleQuote: true,
  semiColons: false,
});

console.log(pretty);
```

###### Output #2

```js
const foo = {
  bar: "baz",
  qux: "quux",
  iam: "ugly",
  rrrawwwr: "😡",
};
```

---

##### Overload #4 of 5

```ts
public formatSync(input: TemplateStringsArray, ...values: unknown): string;
```

Synchronously formats the given input, returning the result as a string. You may
optionally provide an `overrides` object as the first or last interpolated
template value, which will be merged with the existing instance
[`options`][formatter.options] prior to formatting.

> This is the programmatic equivalent of the `deno fmt` command.

| Tag     | Name         | Description                                                                                                                                                                                                                                          |
| :------ | :----------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `param` | **`input`**  | Template string array containing the target code to be formatted.                                                                                                                                                                                    |
| `param` | **`values`** | The interpolated values to be parsed and used to construct the template string. If the first or the last value are an [`Options`][options] object, it will be merged with the existing instance [`options`](#formatter.options) prior to formatting. |

###### Example

```ts
import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";

const fmt = Formatter.initSync(); // wasm context

const pretty = fmt.formatSync`const foo={
 a:'1',b:"2", c : 3 }${{ lineWidth: 60, useTabs: true }}`;

console.log(pretty);
```

###### Output

```js
const foo = {
  a: "1",
  b: "2",
  c: 3,
};
```

---

##### Overload #5 of 5

```ts
public formatSync(input: string | TemplateStringsArray | BufferSource, ...values: unknown): string | boolean;
```

Synchronously formats the given input, which is provided either as a string,
BufferSource, or a template strings array. Returns the formatted code as a
string, or a boolean representing the result of comparing the formatted code to
its original input. You also can provide an optional `overrides` object as the
first or last interpolated template value, which will be merged with the
existing instance [`options`][formatter.options] prior to formatting.

> This is the programmatic equivalent of the `deno fmt` command.

| Tag     | Name         | Description                                                                                                                                                                                                                                                     |
| :------ | :----------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `param` | **`input`**  | The code to format, either as a string, BufferSource, or a template strings array.                                                                                                                                                                              |
| `param` | **`values`** | The options or interpolated values to be parsed and used to construct the template string. If the first or the last value are an [`Options`][options] object, it will be merged with the existing instance [`options`](#formatter.options) prior to formatting. |

###### Example

```ts
import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";

const fmt = Formatter.initSync(); // wasm context

const pretty = fmt.formatSync`const foo={
 a:'1',b:"2", c : 3 }${{ lineWidth: 60, useTabs: true }}`;

const pretty2 = fmt.formatSync("const foo={a:'1',b:\"2\", c : 3 }", {
  lineWidth: 60,
  useTabs: true,
});

console.log(pretty);
console.log(pretty2 === pretty);
```

###### Output

```js
const foo = {
  a: "1",
  b: "2",
  c: 3,
};

true;
```

---

#### Formatter.check

##### Overload #1 of 3

```ts
public async check(input: string | BufferSource, overrides?: Options): Promise<boolean>;
```

Asynchronously checks if a given `input` is formatted correctly, returning a
Promise that resolves to a boolean representing the results of the check.

> This is the programmatic equivalent of the `deno fmt --check` command.

| Tag     | Name            | Description                      |
| :------ | :-------------- | :------------------------------- |
| `param` | **`input`**     | The code to check.               |
| `param` | **`overrides`** | The options to use for checking. |

###### Example

```ts
import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";

const fmt = await Formatter.init(); // wasm context
const fmtCli = await Formatter.initLegacy(); // cli context

const ugly = `const foo={bar:"baz"}`; // unformatted
const pretty = `const foo = { bar: "baz" };\n`; // formatted

// wasm context
console.log(await fmt.check(ugly)); // false
console.log(await fmt.check(pretty)); // true

// cli context
console.log(await fmtCli.check(ugly)); // false
console.log(await fmtCli.check(pretty)); // true
```

---

##### Overload #2 of 3

```ts
public async check(input: TemplateStringsArray, ...values: unknown): Promise<boolean>;
```

Asynchronously checks if a given `input` is formatted correctly, returning a
Promise that resolves to a boolean representing the results of the check. You
may provide an optional `overrides` object, which can either be the first or the
last interpolated template value. It will be merged with the existing instance
[`options`][formatter.options] prior to checking the input code.

> This is the programmatic equivalent of the `deno fmt --check` command.

| Tag     | Name         | Description                                                                                                                                                                                                                                        |
| :------ | :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `param` | **`input`**  | The code to check, provided as a literal template string.                                                                                                                                                                                          |
| `param` | **`values`** | The interpolated values to be parsed and used to construct the template string. If the first or the last value are an [`Options`][options] object, it will be merged with the existing instance [`options`](#formatter.options) prior to checking. |

##### Example

```ts
import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";

const fmt = await Formatter.init(); // wasm context
const fmtCli = await Formatter.initLegacy(); // cli context

const ugly = `const foo={bar:"baz"}`; // unformatted
const pretty = `const foo = { bar: "baz" };\n`; // formatted

// wasm context
console.log(await fmt.check(ugly)); // false
console.log(await fmt.check(pretty)); // true

// cli context
console.log(await fmtCli.check(ugly)); // false
console.log(await fmtCli.check(pretty)); // true
```

###### Output

```log
false
true
false
true
```

---

##### Overload #3 of 3

```ts
public async check(input: string | BufferSource | TemplateStringsArray, ...values: unknown): Promise<boolean>;
```

Asynchronously checks if a given `input` is formatted correctly, either as a
string, BufferSource, or a template strings array. Returns a Promise that
resolves to a boolean representing the results of the check. You may provide an
optional `overrides` object, which can either be the first or the last
interpolated template value. It will be merged with the existing instance
[`options`][formatter.options] prior to checking the input code.

> This is the programmatic equivalent of the `deno fmt --check` command.

| Tag     | Name         | Description                                                                                                                                                                                                                                                   |
| :------ | :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `param` | **`input`**  | The code to check, either as a string, BufferSource, or a template strings array.                                                                                                                                                                             |
| `param` | **`values`** | The options or interpolated values to be parsed and used to construct the template string. If the first or the last value are an [`Options`][options] object, it will be merged with the existing instance [`options`](#formatter.options) prior to checking. |

#### Formatter.checkSync

##### Overload #1 of 3

```ts
public checkSync(input: string | BufferSource, overrides?: Options): boolean;
```

Synchronously checks if a given `input` is formatted correctly, returning a
boolean representing the results of the check.

> This is the programmatic equivalent of the `deno fmt --check` command.

| Tag     | Name            | Description                      |
| :------ | :-------------- | :------------------------------- |
| `param` | **`input`**     | The code to check.               |
| `param` | **`overrides`** | The options to use for checking. |

###### Example

```ts
import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";

const fmt = Formatter.initSync(); // wasm context
const fmtCli = Formatter.initLegacySync(); // cli context

const ugly = `const foo={bar:"baz"}`; // unformatted
const pretty = `const foo = { bar: "baz" };\n`; // formatted

// wasm context
console.log(fmt.checkSync(ugly)); // false
console.log(fmt.checkSync(pretty)); // true

// cli context
console.log(fmtCli.checkSync(ugly)); // false
console.log(fmtCli.checkSync(pretty)); // true
```

###### Output

```log
false
true
false
true
```

---

##### Overload #2 of 3

```ts
public checkSync(input: TemplateStringsArray, ...values: unknown): boolean;
```

Synchronously checks if a given `input` is formatted correctly, returning a
boolean representing the results of the check. You may provide an optional
`overrides` object, which can either be the first or the last interpolated
template value. It will be merged with the existing instance
[`options`][formatter.options] prior to checking the input code.

> This is the programmatic equivalent of the `deno fmt --check` command.

| Tag     | Name         | Description                                                                                                                                                                                                                                        |
| :------ | :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `param` | **`input`**  | The code to check, provided as a literal template string.                                                                                                                                                                                          |
| `param` | **`values`** | The interpolated values to be parsed and used to construct the template string. If the first or the last value are an [`Options`][options] object, it will be merged with the existing instance [`options`](#formatter.options) prior to checking. |

###### Example

```ts
import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";

const fmt = Formatter.initSync(); // wasm context
const fmtCli = Formatter.initLegacySync(); // cli context

const ugly = `const foo={bar:"baz"}`; // unformatted
const pretty = `const foo = { bar: "baz" };\n`; // formatted

// wasm context
console.log(fmt.checkSync(ugly)); // false
console.log(fmt.checkSync(pretty)); // true

// cli context
console.log(fmtCli.checkSync(ugly)); // false
console.log(fmtCli.checkSync(pretty)); // true
```

###### Output

```log
false
true
false
true
```

---

##### Overload #3 of 3

```ts
public checkSync(input: string | BufferSource | TemplateStringsArray, ...values: unknown): boolean;
```

Synchronously checks if a given `input` is formatted correctly, either as a
string, BufferSource, or a template strings array. Returns a boolean
representing the results of the check. You may provide an optional `overrides`
object, which can either be the first or the last interpolated template value.
It will be merged with the existing instance [`options`][formatter.options]
prior to checking the input code.

> This is the programmatic equivalent of the `deno fmt --check` command.

| Tag     | Name         | Description                                                                                                                                                                                                                                                   |
| :------ | :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `param` | **`input`**  | The code to check, either as a string, BufferSource, or a template strings array.                                                                                                                                                                             |
| `param` | **`values`** | The options or interpolated values to be parsed and used to construct the template string. If the first or the last value are an [`Options`][options] object, it will be merged with the existing instance [`options`](#formatter.options) prior to checking. |

---

## Formatting Contexts

The formatter supports two different formatting contexts: the legacy Deno CLI
context, and the newer [`dprint`][dprint] WASM context. Neither of these are
directly available to the user, but are instead used under-the-hood by the
public [`Formatter` class][formatter].

If you're running **`deno_fmt`** in an environment like Deno Deploy, which does
not have access to the [`Deno.Command`][deno-command-api] API, the
[`dprint`][dprint] WASM context will be used by default. Otherwise, if the
`allow-run` permission is enabled and `Deno.Command` **_is_ available**, the
Deno CLI context will be used by default.

There are some performance trade-offs between the two available context types,
which are covered in the sections below.

### ![][badge-class] Class: `WasmContext` (powered by [`dprint`][dprint])

For those using Deno Deploy or other environments **_without_** access to the
[`Deno.Command`][deno-command-api] API or the `allow-run` permission flag, the
[`dprint`][dprint] WASM API is the default formatter context.

```ts
import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";
const fmt = await Formatter.init();

await fmt.format("const a={b:'c'}"); // => const a = { b: "c" };\n
fmt.checkSync("const foo = {bar: 'baz'}"); // => false
```

##### WASM Performance

If you're using the WASM formatting engine, you may notice a slight delay on
initial load, due to the time it takes to instantiate the WASM binary (quite a
large file). Once the binary is loaded, however, the WASM implementation's an
**extremely** fast formatter, often clocking in speeds that are nearly as fast
as returning cached results from the LRU cache.

### ![][badge-class] Class: `CommandContext` (powered by Deno CLI)

If you're using the Deno CLI (or are running in some other environment with
access to the [`Deno.Command`][deno-command-api] API and have `allow-run`
permissions), the standard `deno fmt` shell command is the default formatter.

The `CommandContext` class is a custom communication pipeline between the Deno
CLI and the formatter, which allows for streaming data to and from the CLI using
subprocess pipes. This allows for very fast formatting, with little overhead
cost for spawning subprocesses. It is faster at startup time than the WASM
engine, but may be slower at formatting time depending on the size of the code
being formatted.

```ts
import { Formatter } from "https://deno.land/x/deno_fmt/mod.ts";

const fmt = await Formatter.initLegacy();

await fmt.format("const foo = {bar: 'baz'}");
// => const foo = { bar: "baz" };\n

fmt.formatSync("const foo = {bar: 'baz'}", { check: true });
// => false
```

##### CLI Performance

If you're using the [CLI] formatting engine, you might notice a much faster
start up time, but a slightly slower formatting time. This is due to the
overhead of spawning a subprocess, and the additional cost of piping data to and
from the spawned subprocess. However, the [CLI] implementation is still a very
fast formatter, and is often only a few milliseconds slower than the WASM
implementation.

If you can afford the initial load time, the [WASM] implementation will likely
prove to be your best bet. However, if you cannot afford the initial loading
time, but **can** afford to spare a few milliseconds on each format, the CLI
implementation might be a better choice for you.

Benchmarks **_have_** shown the [CLI] to outperform the [WASM] engine when
formatting large files (e.g. 100+ KB), but the [WASM] engine tends to outperform
the [CLI] when formatting smaller files (e.g. 10 KB or less).

Unfortunately, if you're running in an environment like [Deno Deploy], or if the
`allow-run` permission is unavailable in your scenario, the [CLI] option is not
available to you -- you'll have to use the WASM implementation.

---

## Examples

#### Asynchronous Formatting

```ts
await format(`class Foo { bar: number; constructor() { this.bar = 1 } }`, {
  indentWidth: 4,
});
// => "class Foo {\n    bar: number;\n    constructor() {\n        this.bar = 1;\n    }\n}\n"
```

#### Synchronous Formatting

```ts
formatSync(`if (${Math.random()} > 0.5) { console.log("Heads! You win!") }`, {
  semiColons: false,
  singleQuote: true,
  lineWidth: 120,
});
// => "if (0.12042881392202598 > 0.5) console.log('Heads! You win!')\n"
```

#### Check Mode (`--check`)

```ts
await fmt.format(`const foo = "bar";\n`, { check: true });
// => true

await fmt.check(`const foo = "bar";\n`, { singleQuote: true });
// => false
```

#### Tagged Template Syntax

When using the tagged template syntax, the options may be provided inline as an
interpolated template value. The first or the last interpolated value are the
suggested locations, but an attempt will be made to resolve the options from any
of the values it receives.

Supported by [`format`][format], [`formatSync`][formatsync], [`check`][check],
and [`checkSync`][checksync].

```ts
fmt.formatSync`if(${Math.random()}>0.5) {
console.log("Tails! You lose :(")}${{
  semiColons: false,
  singleQuote: true,
  lineWidth: 50,
  useTabs: true,
}}`;
// => "if (0.46519207002035357 > 0.5) {\n\tconsole.log('Tails! You lose :(')\n}\n"
```

---

## Performance Benchmarks

### `deno_fmt` vs. `prettier`

#### Formatting a 45 KB TypeScript File

```c
group 45kb

benchmark                                  time (avg)            iter/s         (min … max)
-------------------------------------------------------------------------------------------
prettier_45kb_async                     24.73 ms/iter          40.4   (20.23 ms … 45.87 ms)
deno_fmt_legacy_45kb_async              28.18 ms/iter          35.5   (26.88 ms … 31.38 ms)
deno_fmt_legacy_45kb_sync               36.36 ms/iter          27.5   (35.62 ms … 38.48 ms)
deno_fmt_wasm_45kb_async                18.28 ms/iter          54.7    (11.95 ms … 27.5 ms)
deno_fmt_wasm_45kb_sync                  14.2 ms/iter          70.4   (10.05 ms … 20.21 ms)
```

##### Formatting a 45kb File with LRU (for `deno_fmt` only)

```c
group 45kb cached

benchmark                                  time (avg)            iter/s         (min … max)
-------------------------------------------------------------------------------------------
prettier_45kb_cached_async              23.38 ms/iter          42.8   (17.81 ms … 50.54 ms)
deno_fmt_legacy_45kb_cached_async        1.44 ms/iter         693.0     (1.39 ms … 3.88 ms)
deno_fmt_legacy_45kb_cached_sync         1.41 ms/iter         707.5     (1.38 ms … 3.04 ms)
deno_fmt_wasm_45kb_cached_async           1.4 ms/iter         714.2     (1.36 ms … 3.28 ms)
deno_fmt_wasm_45kb_cached_sync           1.37 ms/iter         728.8     (1.36 ms … 2.44 ms)
```

#### Formatting a ~200 KB JavaScript File

```c
group 200kb

benchmark                                  time (avg)            iter/s         (min … max)
-------------------------------------------------------------------------------------------
prettier_200kb_async                    292.8 ms/iter           3.4 (272.44 ms … 305.52 ms)
deno_fmt_legacy_200kb_async            164.79 ms/iter           6.1 (162.08 ms … 169.79 ms)
deno_fmt_legacy_200kb_sync             410.71 ms/iter           2.4  (399.1 ms … 421.29 ms)
deno_fmt_wasm_200kb_async              205.55 ms/iter           4.9 (193.22 ms … 225.92 ms)
deno_fmt_wasm_200kb_sync               209.99 ms/iter           4.8  (198.77 ms … 224.6 ms)
```

##### Formatting a 200kb File with LRU (for `deno_fmt` only)

```c
group 200kb cached

benchmark                                  time (avg)            iter/s         (min … max)
-------------------------------------------------------------------------------------------
prettier_200kb_cached_async            293.23 ms/iter           3.4 (280.32 ms … 304.61 ms)
deno_fmt_legacy_200kb_cached_async        5.6 ms/iter         178.5     (5.56 ms … 5.83 ms)
deno_fmt_legacy_200kb_cached_sync        5.66 ms/iter         176.8      (5.56 ms … 7.1 ms)
deno_fmt_wasm_200kb_cached_async         5.58 ms/iter         179.2     (5.53 ms … 6.18 ms)
deno_fmt_wasm_200kb_cached_sync          5.57 ms/iter         179.5      (5.54 ms … 5.7 ms)
```

#### Formatting a ~500 KB JavaScript File

```c
group 500kb

benchmark                                  time (avg)         iter/s           (min … max)
-------------------------------------------------------------------------------------------
prettier_500kb_async                   903.08 ms/iter           1.1  (873.3 ms … 957.46 ms)
deno_fmt_legacy_500kb_async            479.27 ms/iter           2.1  (469.1 ms … 490.25 ms)
deno_fmt_legacy_500kb_sync                1.83 s/iter           0.5       (1.78 s … 1.98 s)
deno_fmt_wasm_500kb_async                 1.76 s/iter           0.6    (759.22 ms … 3.56 s)
deno_fmt_wasm_500kb_sync                  2.82 s/iter           0.4        (2.7 s … 2.96 s)
```

##### Formatting a 500kb File with LRU (for `deno_fmt` only)

```c
group 500kb cached

benchmark                                  time (avg)         iter/s           (min … max)
-------------------------------------------------------------------------------------------
prettier_500kb_cached_async            903.62 ms/iter           1.1 (875.56 ms … 938.27 ms)
deno_fmt_legacy_500kb_cached_async      15.47 ms/iter          64.7     (15.2 ms … 15.8 ms)
deno_fmt_legacy_500kb_cached_sync       15.26 ms/iter          65.5    (15.2 ms … 15.48 ms)
deno_fmt_wasm_500kb_cached_async        15.27 ms/iter          65.5   (15.18 ms … 15.69 ms)
deno_fmt_wasm_500kb_cached_sync         15.23 ms/iter          65.6   (15.17 ms … 15.53 ms)
```

---

## Further Reading

### Why?

Code formatting is a crucial part of modern development. While other formatting
tools such as `prettier` provide programmatic APIs for their tools, I found the
native `deno fmt` tool was **_only_** available via the CLI, and not supported
from within the runtime.

It was in that moment that the idea for the `deno_fmt` package was born, with
the goal of bridging the gap by offering a well-made formatting tool that feels
right at home in your existing Deno toolkit.

The formatter and options were carefully designed, with a non-trivial amount of
time spent ensuring its API is closely aligned with the native `deno fmt` tool.
This means that you can use the same options you're already familiar with, and
expect the same results you're used to seeing from the CLI.

Thanks to the power of [`dprint`][dprint], the formatter is also compatible with
the Deno CLI, and can be used in cloud environments like Deno Deploy without any
additional configuration.

---

##### [**MIT**][mit] © [**Nicholas Berlette**][nberlette]. All rights reserved.

###### This is unofficial project is not affiliated with [**Deno**][deno] or [**Deno Deploy**][Deno Deploy].

###### [**dprint**][dprint] is published by [**David Sherret**][dsherret] under the **MIT** License (you rock, David!).

[dprint]: https://dprint.dev "dprint - a pluggable and configurable code formatter written in Rust"
[deno-command-api]: https://deno.land/api@v1.39.1?s=Deno.Command&unstable "Read the Deno Manual v1.39.1 - Deno.Command API"
[nberlette]: https://github.com/nberlette "Nicholas Berlette's GitHub Profile"
[dsherret]: https://github.com/dsherret "David Sherret's GitHub Profile"
[mit]: https://nick.mit-license.org "MIT License"
[deno]: https://deno.land "Deno's Official Homepage"
[perf]: #performance-benchmarks "Performance Benchmarks"
[check]: #function-check "Function: check"
[checksync]: #function-checksync "Function: checkSync"
[format]: #function-format "Function: format"
[formatsync]: #function-formatsync "Function: formatSync"
[formatter]: #class-formatter "Class: Formatter"
[options]: #interface-options "Interface: Options"
[formatter.options]: #formatter.options "Instance Property: Formatter.options"
[config]: #interface-config "Interface: Config"
[cache]: #interface-cacheconfig "Interface: CacheConfig"
[WASM]: #class-wasmcontext-powered-by-dprint "Class: WasmContext"
[CLI]: #class-commandcontext-powered-by-deno-cli "Class: CommandContext"
[examples]: #examples "Examples"
[Deno Deploy]: https://dash.deno.com "Deno Deploy"
[deno-fmt-doc]: https://deno.land/x/deno_fmt/mod.ts?doc "Deno Documentation for deno_fmt"
[deno-json-spec]: https://deno.land/manual/getting_started/configuration#fmt "Deno Manual v1.36.1 - 'deno.json' Configuration File"
[gfm]: https://github.github.com/gfm/ "GitHub Flavored Markdown Spec"
[badge-variable]: data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAyNCAyNCcgaWQ9J2xldHRlci12LXNxdWFyZScgY29sb3I9JyM3RTU3QzAnIGZpbGw9JyM3RTU3QzAxQScgc3Ryb2tlPScjN0U1N0MwJyBzdHJva2UtbGluZWNhcD0ncm91bmQnIHN0cm9rZS1saW5lam9pbj0ncm91bmQnIHdpZHRoPScxLjVyZW0nIGhlaWdodD0nMS41cmVtJz48ZyBzdHJva2Utd2lkdGg9JzEuNSc+PHBhdGggZD0nbTkgOC4yNWwzIDhsMy04Jy8+PHBhdGggZD0nTTMgMTJjMC00LjI0MyAwLTYuMzY0IDEuMzE4LTcuNjgyQzUuNjM2IDMgNy43NTggMyAxMiAzYzQuMjQzIDAgNi4zNjQgMCA3LjY4MiAxLjMxOEMyMSA1LjYzNiAyMSA3Ljc1OCAyMSAxMmMwIDQuMjQzIDAgNi4zNjQtMS4zMTggNy42ODJDMTguMzY0IDIxIDE2LjI0MiAyMSAxMiAyMWMtNC4yNDMgMC02LjM2NCAwLTcuNjgyLTEuMzE4QzMgMTguMzY0IDMgMTYuMjQyIDMgMTInLz48L2c+PC9zdmc+
[badge-interface]: data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAyNCAyNCcgaWQ9J2xldHRlci1pLXNxdWFyZScgY29sb3I9JyNEMkEwNjQnIGZpbGw9JyNENEEwNjgxQScgc3Ryb2tlPScjRDJBMDY0JyBzdHJva2UtbGluZWNhcD0ncm91bmQnIHN0cm9rZS1saW5lam9pbj0ncm91bmQnIHdpZHRoPScxLjVyZW0nIGhlaWdodD0nMS41cmVtJz48cGF0aCBzdHJva2Utd2lkdGg9JzEuNScgZD0nTTkuNSA4SDEybTAgMGgyLjVNMTIgOHY4bTIuNSAwSDEybTAgMEg5LjVNMyAxMmMwLTQuMjQzIDAtNi4zNjQgMS4zMTgtNy42ODJDNS42MzYgMyA3Ljc1OCAzIDEyIDNjNC4yNDMgMCA2LjM2NCAwIDcuNjgyIDEuMzE4QzIxIDUuNjM2IDIxIDcuNzU4IDIxIDEyYzAgNC4yNDMgMCA2LjM2NC0xLjMxOCA3LjY4MkMxOC4zNjQgMjEgMTYuMjQyIDIxIDEyIDIxYy00LjI0MyAwLTYuMzY0IDAtNy42ODItMS4zMThDMyAxOC4zNjQgMyAxNi4yNDIgMyAxMicvPjwvc3ZnPg==
[badge-typeAlias]: data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAyNCAyNCcgaWQ9J2xldHRlci10LXNxdWFyZScgY29sb3I9JyNBNDQ3OEMnIGZpbGw9JyNBNDQ3OEMxQScgc3Ryb2tlPScjQTQ0NzhDJyBzdHJva2UtbGluZWNhcD0ncm91bmQnIHN0cm9rZS1saW5lam9pbj0ncm91bmQnIHdpZHRoPScxLjVyZW0nIGhlaWdodD0nMS41cmVtJz48cGF0aCBzdHJva2Utd2lkdGg9JzEuNScgZD0nTTkgOC4yNWgzbTAgMGgzbS0zIDB2OE0zIDEyYzAtNC4yNDMgMC02LjM2NCAxLjMxOC03LjY4MkM1LjYzNiAzIDcuNzU4IDMgMTIgM2M0LjI0MyAwIDYuMzY0IDAgNy42ODIgMS4zMThDMjEgNS42MzYgMjEgNy43NTggMjEgMTJjMCA0LjI0MyAwIDYuMzY0LTEuMzE4IDcuNjgyQzE4LjM2NCAyMSAxNi4yNDIgMjEgMTIgMjFjLTQuMjQzIDAtNi4zNjQgMC03LjY4Mi0xLjMxOEMzIDE4LjM2NCAzIDE2LjI0MiAzIDEyJy8+PC9zdmc+
[badge-namespace]: data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAyNCAyNCcgaWQ9J2xldHRlci1uLXNxdWFyZScgY29sb3I9JyNkMjU2NDYnIGZpbGw9JyNEMjU2NDYxQScgc3Ryb2tlPScjZDI1NjQ2JyBzdHJva2UtbGluZWNhcD0ncm91bmQnIHN0cm9rZS1saW5lam9pbj0ncm91bmQnIHdpZHRoPScxLjVyZW0nIGhlaWdodD0nMS41cmVtJz48ZyBzdHJva2Utd2lkdGg9JzEuNSc+PHBhdGggZD0nTTkgMTZWOGw2IDhWOCcvPjxwYXRoIGQ9J00zIDEyYzAtNC4yNDMgMC02LjM2NCAxLjMxOC03LjY4MkM1LjYzNiAzIDcuNzU4IDMgMTIgM2M0LjI0MyAwIDYuMzY0IDAgNy42ODIgMS4zMThDMjEgNS42MzYgMjEgNy43NTggMjEgMTJjMCA0LjI0MyAwIDYuMzY0LTEuMzE4IDcuNjgyQzE4LjM2NCAyMSAxNi4yNDIgMjEgMTIgMjFjLTQuMjQzIDAtNi4zNjQgMC03LjY4Mi0xLjMxOEMzIDE4LjM2NCAzIDE2LjI0MiAzIDEyJy8+PC9nPjwvc3ZnPg==
[badge-class]: data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAyNCAyNCcgaWQ9J2xldHRlci1jLXNxdWFyZScgY29sb3I9JyMyMEI0NEInIGZpbGw9JyMyRkE4NTAxQScgc3Ryb2tlPScjMjBCNDRCJyBzdHJva2UtbGluZWNhcD0ncm91bmQnIHN0cm9rZS1saW5lam9pbj0ncm91bmQnIHdpZHRoPScxLjVyZW0nIGhlaWdodD0nMS41cmVtJz48ZyBzdHJva2Utd2lkdGg9JzEuNSc+PHBhdGggZD0nTTE1IDEwdi0uMjVBMS43NSAxLjc1IDAgMCAwIDEzLjI1IDhIMTFhMiAyIDAgMCAwLTIgMnY0YTIgMiAwIDAgMCAyIDJoMi4yNUExLjc1IDEuNzUgMCAwIDAgMTUgMTQuMjVWMTQnLz48cGF0aCBkPSdNMyAxMmMwLTQuMjQzIDAtNi4zNjQgMS4zMTgtNy42ODJDNS42MzYgMyA3Ljc1OCAzIDEyIDNjNC4yNDMgMCA2LjM2NCAwIDcuNjgyIDEuMzE4QzIxIDUuNjM2IDIxIDcuNzU4IDIxIDEyYzAgNC4yNDMgMCA2LjM2NC0xLjMxOCA3LjY4MkMxOC4zNjQgMjEgMTYuMjQyIDIxIDEyIDIxYy00LjI0MyAwLTYuMzY0IDAtNy42ODItMS4zMThDMyAxOC4zNjQgMyAxNi4yNDIgMyAxMicvPjwvZz48L3N2Zz4=
[badge-function]: data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAyNCAyNCcgaWQ9J2xldHRlci1mLXNxdWFyZScgY29sb3I9JyMwNTZDRjAnIGZpbGw9JyMwMjZCRUIxQScgc3Ryb2tlPScjMDU2Q0YwJyBzdHJva2UtbGluZWNhcD0ncm91bmQnIHN0cm9rZS1saW5lam9pbj0ncm91bmQnIHdpZHRoPScxLjVyZW0nIGhlaWdodD0nMS41cmVtJz48ZyBzdHJva2Utd2lkdGg9JzEuNSc+PHBhdGggZD0nTTE0Ljc1IDhoLTV2NG0wIDB2NG0wLTRoNCcvPjxwYXRoIGQ9J00zIDEyYzAtNC4yNDMgMC02LjM2NCAxLjMxOC03LjY4MkM1LjYzNiAzIDcuNzU4IDMgMTIgM2M0LjI0MyAwIDYuMzY0IDAgNy42ODIgMS4zMThDMjEgNS42MzYgMjEgNy43NTggMjEgMTJjMCA0LjI0MyAwIDYuMzY0LTEuMzE4IDcuNjgyQzE4LjM2NCAyMSAxNi4yNDIgMjEgMTIgMjFjLTQuMjQzIDAtNi4zNjQgMC03LjY4Mi0xLjMxOEMzIDE4LjM2NCAzIDE2LjI0MiAzIDEyJy8+PC9nPjwvc3ZnPg==
