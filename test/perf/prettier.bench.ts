/**
 * Benchmark comparison runs between `deno_fmt` and `prettier`.
 * @module
 * @internal
 * @category Performance
 */
import * as prettier from "npm:prettier@^3.0.2";
import { Formatter } from "../../mod.ts";
import { bundle } from "https://deno.land/x/emit@0.25.0/mod.ts";

// 45kb source file from our own codebase :)
const unformatted_1 = await Deno.readTextFile("./src/fmt.ts");

// ~200kb bundled file from the deno standard library's node polyfills
const bundle_target = "https://deno.land/std@0.177.1/node/buffer.ts";
const { code: unformatted_2 } = await bundle(bundle_target, {
  compilerOptions: { sourceMap: true },
});

const wasm = await Formatter.init({ cache: false, options: { ext: "ts" } });
const deno = await Formatter.initLegacy({
  cache: false,
  options: { ext: "ts" },
});

const wasm_cached = await Formatter.init({
  cache: { capacity: 5, ttl: 500 },
  options: { ext: "ts" },
});
const deno_cached = await Formatter.initLegacy({
  cache: { capacity: 5, ttl: 500 },
  options: { ext: "ts" },
});

Deno.bench(
  { group: "45kb", baseline: true },
  async function prettier_45kb_async() {
    await prettier.format(unformatted_1, {
      semi: false,
      singleQuote: true,
      proseWrap: "always",
      parser: "typescript",
    });
  },
);

Deno.bench({ group: "45kb" }, async function deno_fmt_legacy_45kb_async() {
  await deno.format(unformatted_1, { semiColons: false, singleQuote: true });
});

Deno.bench({ group: "45kb" }, function deno_fmt_legacy_45kb_sync() {
  deno.formatSync(unformatted_1, { semiColons: false, singleQuote: true });
});

Deno.bench({ group: "45kb" }, async function deno_fmt_wasm_45kb_async() {
  await wasm.format(unformatted_1, { semiColons: false, singleQuote: true });
});

Deno.bench({ group: "45kb" }, function deno_fmt_wasm_45kb_sync() {
  wasm.formatSync(unformatted_1, { semiColons: false, singleQuote: true });
});

Deno.bench(
  { group: "200kb", baseline: true },
  async function prettier_200kb_async() {
    await prettier.format(unformatted_2, {
      semi: false,
      singleQuote: true,
      proseWrap: "always",
      parser: "typescript",
    });
  },
);

Deno.bench({ group: "200kb" }, async function deno_fmt_legacy_200kb_async() {
  await deno.format(unformatted_2, { semiColons: false, singleQuote: true });
});

Deno.bench({ group: "200kb" }, function deno_fmt_legacy_200kb_sync() {
  deno.formatSync(unformatted_2, { semiColons: false, singleQuote: true });
});

Deno.bench({ group: "200kb" }, async function deno_fmt_wasm_200kb_async() {
  await wasm.format(unformatted_2, { semiColons: false, singleQuote: true });
});

Deno.bench({ group: "200kb" }, function deno_fmt_wasm_200kb_sync() {
  wasm.formatSync(unformatted_2, { semiColons: false, singleQuote: true });
});

Deno.bench(
  { group: "45kb_cached", baseline: true },
  async function prettier_45kb_cached_async() {
    await prettier.format(unformatted_1, {
      semi: false,
      singleQuote: true,
      proseWrap: "always",
      parser: "typescript",
    });
  },
);

Deno.bench(
  { group: "45kb_cached" },
  async function deno_fmt_legacy_45kb_cached_async() {
    await deno_cached.format(unformatted_1, {
      semiColons: false,
      singleQuote: true,
    });
  },
);

Deno.bench(
  { group: "45kb_cached" },
  function deno_fmt_legacy_45kb_cached_sync() {
    deno_cached.formatSync(unformatted_1, {
      semiColons: false,
      singleQuote: true,
    });
  },
);

Deno.bench(
  { group: "45kb_cached" },
  async function deno_fmt_wasm_45kb_cached_async() {
    await wasm_cached.format(unformatted_1, {
      semiColons: false,
      singleQuote: true,
    });
  },
);

Deno.bench({ group: "45kb_cached" }, function deno_fmt_wasm_45kb_cached_sync() {
  wasm_cached.formatSync(unformatted_1, {
    semiColons: false,
    singleQuote: true,
  });
});

Deno.bench(
  { group: "200kb_cached", baseline: true },
  async function prettier_200kb_cached_async() {
    await prettier.format(unformatted_2, {
      semi: false,
      singleQuote: true,
      proseWrap: "always",
      parser: "typescript",
    });
  },
);

Deno.bench(
  { group: "200kb_cached" },
  async function deno_fmt_legacy_200kb_cached_async() {
    await deno_cached.format(unformatted_2, {
      semiColons: false,
      singleQuote: true,
    });
  },
);

Deno.bench(
  { group: "200kb_cached" },
  function deno_fmt_legacy_200kb_cached_sync() {
    deno_cached.formatSync(unformatted_2, {
      semiColons: false,
      singleQuote: true,
    });
  },
);

Deno.bench(
  { group: "200kb_cached" },
  async function deno_fmt_wasm_200kb_cached_async() {
    await wasm_cached.format(unformatted_2, {
      semiColons: false,
      singleQuote: true,
    });
  },
);

Deno.bench(
  { group: "200kb_cached" },
  function deno_fmt_wasm_200kb_cached_sync() {
    wasm_cached.formatSync(unformatted_2, {
      semiColons: false,
      singleQuote: true,
    });
  },
);
