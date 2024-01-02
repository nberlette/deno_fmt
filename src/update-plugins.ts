#!/usr/bin/env -S deno run --allow-net --allow-write --allow-read

const plugins = {
  json: "https://plugins.dprint.dev/json-latest.wasm",
  markdown: "https://plugins.dprint.dev/markdown-latest.wasm",
  toml: "https://plugins.dprint.dev/toml-latest.wasm",
  typescript: "https://plugins.dprint.dev/typescript-latest.wasm",
};

/**
 * Fetches the latest version of the plugins from the dprint.dev website,
 * and writes them out to the `wasm` directory. This is used as a binary
 * to update the plugins in the repository for each release.
 */
// deno-lint-ignore ban-types
async function update(name?: (string & {}) | keyof typeof plugins) {
  const dir = import.meta.resolve("./wasm").replace(/^file\:\/\//, "");

  try {
    await Deno.mkdir(dir, { recursive: true });
  } catch { /* ignore */ }

  for (const key in plugins) {
    if (name && key !== name) continue;
    const url = plugins[key as keyof typeof plugins];
    const path = `${dir}/${key}.wasm`;
    const res = await fetch(url);
    const buf = new Uint8Array(await res.arrayBuffer());
    await Deno.writeFile(path, buf, { create: true, mode: 0o755 });
    console.log(
      `\x1b[1;92m✓ wrote ${(buf.length / 1024 / 1024).toFixed(2)} MB → ${path}\x1b[0m`,
    );
  }
}

if (import.meta.main) await update(Deno.args[0]);
